import json
import os
import boto3
from typing import Dict, Any, List, Set

s3_client = boto3.client("s3")

# S3 configuration
BUCKET_NAME = os.environ.get("BUCKET_NAME", "cloud-computing-lab2-a0357008e")
PREFIX = os.environ.get("PREFIX", "twitter_stats/")
DEFAULT_USER_IDS = ["214328887", "107830991"]

# In-memory cache across warm Lambda invocations
CACHE: Dict[str, Dict[str, Any]] = {}

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
}


def extract_user_ids(event: Dict[str, Any]) -> List[str]:
    """Extract requested user IDs from query params, path params, body, or test events."""
    if not event:
        return DEFAULT_USER_IDS

    # 1. From direct event keys (e.g., AWS Lambda console test event)
    if "userId" in event and isinstance(event["userId"], str) and event["userId"].strip():
        return [event["userId"].strip()]
    if "userIds" in event:
        if isinstance(event["userIds"], list):
            return [str(u).strip() for u in event["userIds"] if str(u).strip()]
        if isinstance(event["userIds"], str):
            return [u.strip() for u in event["userIds"].split(",") if u.strip()]

    # 2. From query string parameters (e.g., GET ?userId=214328887 or ?userIds=214328887,107830991)
    q_params = event.get("queryStringParameters") or {}
    if "userId" in q_params and q_params["userId"]:
        return [u.strip() for u in q_params["userId"].split(",") if u.strip()]
    if "userIds" in q_params and q_params["userIds"]:
        return [u.strip() for u in q_params["userIds"].split(",") if u.strip()]

    # 3. From path parameters
    p_params = event.get("pathParameters") or {}
    if "userId" in p_params and p_params["userId"]:
        return [p_params["userId"].strip()]

    # 4. From POST request body
    body = event.get("body")
    if body:
        try:
            body_data = json.loads(body) if isinstance(body, str) else body
            if isinstance(body_data, dict):
                if "userId" in body_data and body_data["userId"]:
                    return [str(body_data["userId"]).strip()]
                if "userIds" in body_data and body_data["userIds"]:
                    val = body_data["userIds"]
                    if isinstance(val, list):
                        return [str(u).strip() for u in val if str(u).strip()]
                    return [u.strip() for u in str(val).split(",") if u.strip()]
        except Exception:
            pass

    # Default to the two required assignment users
    return DEFAULT_USER_IDS


def query_s3_user_stats(bucket: str, prefix: str, target_ids: List[str]) -> List[Dict[str, Any]]:
    """Scan S3 part files in prefix to find statistics for the given target user IDs."""
    global CACHE

    target_set = set(target_ids)
    results: Dict[str, Dict[str, Any]] = {}
    remaining_ids: Set[str] = set()

    # Check memory cache first
    for uid in target_ids:
        if uid in CACHE:
            results[uid] = CACHE[uid]
        else:
            remaining_ids.add(uid)

    # If all requested IDs are cached, return immediately
    if not remaining_ids:
        return [results[uid] for uid in target_ids if uid in results]

    # List all objects in the S3 prefix
    paginator = s3_client.get_paginator("list_objects_v2")
    part_keys: List[str] = []

    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            # Skip folders, logs, or _SUCCESS marker files
            if key.endswith("/") or key.endswith("_SUCCESS") or "_$" in key:
                continue
            if "part-" in key or key.endswith(".json"):
                part_keys.append(key)

    if not part_keys:
        raise ValueError(
            f"No data part files found in s3://{bucket}/{prefix}. "
            "Please ensure the Spark job has completed and output files exist."
        )

    # Read part files line-by-line (NDJSON / JSON lines)
    for key in part_keys:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        for line in response["Body"].iter_lines():
            if not line:
                continue
            try:
                record = json.loads(line.decode("utf-8"))
            except Exception:
                continue

            uid = str(record.get("userId", "")).strip()
            if not uid:
                continue

            stat = {
                "userId": uid,
                "followers": int(record.get("followers", 0)),
                "followees": int(record.get("followees", 0)),
            }
            CACHE[uid] = stat

            if uid in remaining_ids:
                results[uid] = stat
                remaining_ids.remove(uid)

        # Early termination if all requested IDs were found
        if len(remaining_ids) == 0:
            break

    # If any requested ID was not found in the dataset, mark with 0 counts
    for uid in remaining_ids:
        stat = {
            "userId": uid,
            "followers": 0,
            "followees": 0,
            "notFound": True,
        }
        CACHE[uid] = stat
        results[uid] = stat

    return [results[uid] for uid in target_ids if uid in results]


def lambda_handler(event, context):
    # Handle HTTP OPTIONS for CORS pre-flight
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method")
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    try:
        user_ids = extract_user_ids(event)
        stats = query_s3_user_stats(BUCKET_NAME, PREFIX, user_ids)

        # Generate formatted lines as specified in the lab spec:
        # UserID has Number_of_followers
        # UserID has Number_of_followees
        formatted_lines = []
        for item in stats:
            formatted_lines.append(f"{item['userId']} has {item['followers']} followers")
            formatted_lines.append(f"{item['userId']} has {item['followees']} followees")

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "users": stats,
                "formatted": formatted_lines,
                "totalUsers": len(stats),
            }),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": str(e),
                "message": "Failed to retrieve Twitter statistics from S3",
            }),
        }
