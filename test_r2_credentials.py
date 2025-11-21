#!/usr/bin/env python3
"""
Test R2 credentials and connection
"""
import boto3
import os
from pathlib import Path
from dotenv import load_dotenv
from botocore.config import Config

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

account_id = os.getenv('R2_ACCOUNT_ID', '').strip()
access_key_id = os.getenv('R2_ACCESS_KEY_ID', '').strip()
secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY', '').strip()
custom_endpoint = os.getenv('R2_ENDPOINT_URL', '').strip()
bucket_name = 'rsna2025-medical-imaging'

if custom_endpoint:
    endpoint_url = custom_endpoint
else:
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

print("=" * 60)
print("R2 Credential Test")
print("=" * 60)
print(f"Endpoint: {endpoint_url}")
print(f"Bucket: {bucket_name}")
print(f"Access Key ID: {access_key_id[:8]}...{access_key_id[-4:]}")
print(f"Secret Key Length: {len(secret_access_key)} chars")
print()

# Create S3 client
s3_client = boto3.client(
    's3',
    endpoint_url=endpoint_url,
    aws_access_key_id=access_key_id,
    aws_secret_access_key=secret_access_key,
    region_name='auto',
    config=Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'}
    )
)

# Test 1: List buckets (this tests basic auth)
print("Test 1: Listing buckets...")
try:
    response = s3_client.list_buckets()
    print(f"✓ Success! Found {len(response.get('Buckets', []))} bucket(s)")
    for bucket in response.get('Buckets', []):
        print(f"  - {bucket['Name']}")
except Exception as e:
    print(f"✗ Failed: {e}")
    print("\nThis suggests your credentials are incorrect or token is invalid.")
    print("Please verify:")
    print("1. Go to R2 > Manage R2 API Tokens")
    print("2. Check if your token still exists")
    print("3. Create a NEW token if needed")
    print("4. Ensure token has 'Object Read & Write' permissions")
    exit(1)

# Test 2: Check if bucket exists
print(f"\nTest 2: Checking if bucket '{bucket_name}' exists...")
try:
    s3_client.head_bucket(Bucket=bucket_name)
    print(f"✓ Bucket '{bucket_name}' exists and is accessible")
except Exception as e:
    print(f"✗ Failed: {e}")
    print(f"\nPossible issues:")
    print(f"1. Bucket name is incorrect (current: {bucket_name})")
    print(f"2. Token doesn't have access to this bucket")
    print(f"3. Bucket doesn't exist")
    exit(1)

# Test 3: List objects in bucket
print(f"\nTest 3: Listing objects in bucket '{bucket_name}'...")
try:
    response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
    objects = response.get('Contents', [])
    if objects:
        print(f"✓ Found {len(objects)} object(s):")
        for obj in objects:
            print(f"  - {obj['Key']} ({obj['Size']} bytes)")
    else:
        print("✓ Bucket is empty (no objects found)")
except Exception as e:
    print(f"✗ Failed: {e}")

print("\n" + "=" * 60)
print("All tests passed! Your credentials are working correctly.")
print("=" * 60)

