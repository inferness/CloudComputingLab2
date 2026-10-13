from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder \
    .appName("TwitterAnalytics") \
    .getOrCreate()

# 1. Read dataset from S3
df = spark.read.csv(
    "s3://cloud-computing-lab2-a0357008e/twitter_combined.txt",
    sep=" ",
    schema="follower STRING, followee STRING"
)

# 2. Remove duplicate relationships
df = df.distinct()

# 3. Calculate number of followers
followers = (
    df.groupBy("followee")
    .agg(F.count("*").alias("followers"))
    .withColumnRenamed("followee", "userId")
)

# 4. Calculate number of followees
followees = (
    df.groupBy("follower")
    .agg(F.count("*").alias("followees"))
    .withColumnRenamed("follower", "userId")
)

# 5. Combine both statistics
result = (
    followers.join(followees, "userId", "full_outer")
    .fillna(0, subset=["followers", "followees"])
)

# 6. Save results to S3
result.write.mode("overwrite").json(
    "s3://cloud-computing-lab2-a0357008e/twitter_stats/"
)

spark.stop()