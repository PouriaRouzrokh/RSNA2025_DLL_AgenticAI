#!/usr/bin/env python3
"""
Upload large files (>300MB) to Cloudflare R2 using S3-compatible API
Requires: pip install boto3 python-dotenv

Credentials are read from .env file in the root directory.
"""
import boto3
import os
import sys
from pathlib import Path
from botocore.config import Config
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

def upload_to_r2(file_path, bucket_name, object_key, account_id, access_key_id, secret_access_key):
    """
    Upload a file to Cloudflare R2 using S3-compatible API
    
    Args:
        file_path: Local path to the file
        bucket_name: R2 bucket name
        object_key: Object key (path) in R2
        account_id: Cloudflare Account ID
        access_key_id: R2 Access Key ID
        secret_access_key: R2 Secret Access Key
    """
    
    # R2 endpoint URL
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    
    # Create S3 client configured for R2
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(
            signature_version='s3v4',
            s3={
                'addressing_style': 'path'
            }
        )
    )
    
    file_size = os.path.getsize(file_path)
    print(f"Uploading {file_path} ({file_size / (1024*1024):.2f} MB) to {bucket_name}/{object_key}...")
    
    # Use multipart upload for large files
    if file_size > 100 * 1024 * 1024:  # 100 MB threshold
        print("Using multipart upload for large file...")
        
        # Create multipart upload
        multipart_upload = s3_client.create_multipart_upload(
            Bucket=bucket_name,
            Key=object_key
        )
        upload_id = multipart_upload['UploadId']
        
        # Upload parts
        part_size = 100 * 1024 * 1024  # 100 MB per part
        parts = []
        part_number = 1
        
        with open(file_path, 'rb') as f:
            while True:
                data = f.read(part_size)
                if not data:
                    break
                
                print(f"Uploading part {part_number}...")
                part = s3_client.upload_part(
                    Bucket=bucket_name,
                    Key=object_key,
                    PartNumber=part_number,
                    UploadId=upload_id,
                    Body=data
                )
                parts.append({
                    'PartNumber': part_number,
                    'ETag': part['ETag']
                })
                part_number += 1
        
        # Complete multipart upload
        s3_client.complete_multipart_upload(
            Bucket=bucket_name,
            Key=object_key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        print("✓ Upload complete!")
    else:
        # Simple upload for smaller files
        s3_client.upload_file(file_path, bucket_name, object_key)
        print("✓ Upload complete!")
    
    print(f"File available at: {endpoint_url}/{bucket_name}/{object_key}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 upload_to_r2.py <file_path> <bucket_name> <object_key>")
        print("\nExample:")
        print("  python3 upload_to_r2.py frontend/public/demo-data/medical_imaging/ct_scan.nii.gz \\")
        print("    rsna2025-medical-imaging ct_scan.nii.gz")
        print("\nCredentials are read from .env file. Required variables:")
        print("  R2_ACCOUNT_ID")
        print("  R2_ACCESS_KEY_ID")
        print("  R2_SECRET_ACCESS_KEY")
        sys.exit(1)
    
    # Get credentials from environment variables
    account_id = os.getenv('R2_ACCOUNT_ID')
    access_key_id = os.getenv('R2_ACCESS_KEY_ID')
    secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
    
    # Validate credentials
    if not account_id:
        print("Error: R2_ACCOUNT_ID not found in .env file")
        sys.exit(1)
    if not access_key_id:
        print("Error: R2_ACCESS_KEY_ID not found in .env file")
        sys.exit(1)
    if not secret_access_key:
        print("Error: R2_SECRET_ACCESS_KEY not found in .env file")
        sys.exit(1)
    
    file_path = sys.argv[1]
    bucket_name = sys.argv[2]
    object_key = sys.argv[3]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    try:
        upload_to_r2(file_path, bucket_name, object_key, account_id, access_key_id, secret_access_key)
    except Exception as e:
        print(f"Error uploading file: {e}")
        sys.exit(1)

