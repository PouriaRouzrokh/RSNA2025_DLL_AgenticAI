from huggingface_hub import hf_hub_download

# Login first if you haven't
# from huggingface_hub import login
# login()

file_path = hf_hub_download(
    repo_id="ibrahimhamamci/CT-RATE",
    filename="dataset/train/train_53/train_53_a/train_53_a_1.nii.gz",
    repo_type="dataset",
    local_dir="."  # Downloads to your current directory
)
print(f"Downloaded to: {file_path}")