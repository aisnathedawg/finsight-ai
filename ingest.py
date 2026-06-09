from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
import os

# Config
DATA_FOLDER = "data"
PERSIST_DIR = "chroma_db"

# List of PDFs to ingest (add more as needed)
pdfs_to_ingest = [
    {"filename": "_10-K-2025-As-Filed (2).pdf", "company": "Apple", "year": "2025", "filing_type": "10-K"},
    # {"filename": "_10-K-2025-Nvidia.pdf", "company": "NVIDIA", "year": "2025", "filing_type": "10-K"},
    # Add more companies here
]

# Load embeddings
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

for pdf in pdfs_to_ingest:
    file_path = os.path.join(DATA_FOLDER, pdf["filename"])
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(documents)

    # Add metadata to each chunk
    for chunk in chunks:
        chunk.metadata["company"] = pdf["company"]
        chunk.metadata["year"] = pdf["year"]
        chunk.metadata["filing_type"] = pdf["filing_type"]

    # Save to Chroma
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=PERSIST_DIR
    )

print("✅ All PDFs ingested with metadata and vector database created successfully!")