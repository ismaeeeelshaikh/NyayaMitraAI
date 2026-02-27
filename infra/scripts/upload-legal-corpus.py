"""
Legal documents S3 pe upload karo.
Yeh Member 2 ke S3 RAG retriever ka data source hai.
Run karo deploy ke baad ek baar.
"""
import boto3
import os
import glob

s3 = boto3.client('s3', region_name='ap-south-1')
BUCKET = os.environ.get('LEGAL_CORPUS_BUCKET', '')

def upload():
    if not BUCKET:
        print("ERROR: LEGAL_CORPUS_BUCKET env variable set nahi hai")
        print("Run karo: export LEGAL_CORPUS_BUCKET=nyaya-mitra-legal-corpus-<account_id>")
        return

    docs = glob.glob('legal-docs/*.txt')
    if not docs:
        print("ERROR: legal-docs/ folder mein koi .txt file nahi mili")
        return

    print(f"Uploading {len(docs)} documents to s3://{BUCKET}/corpus/")

    for doc_path in docs:
        filename = os.path.basename(doc_path)
        key = f"corpus/{filename}"

        with open(doc_path, 'r', encoding='utf-8') as f:
            content = f.read()

        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=content.encode('utf-8'),
            ContentType='text/plain; charset=utf-8'
        )
        print(f"  ✅ Uploaded: {key} ({len(content)} chars)")

    print(f"\n✅ All {len(docs)} legal documents uploaded!")
    print(f"Member 2 ka S3 RAG retriever inhe directly use karega.")
    print(f"Path: s3://{BUCKET}/corpus/")

if __name__ == '__main__':
    upload()
