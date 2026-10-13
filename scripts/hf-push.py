from huggingface_hub import login, upload_folder

login()

upload_folder(
    folder_path="../resources/dataset", 
    repo_id="Sarverott/polish_national_law_docs", 
    repo_type="dataset"
)