from setuptools import setup, find_packages

setup(
    name="booknotfound",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.109.2",
        "uvicorn==0.27.1",
        "python-multipart==0.0.9",
        "pydantic==2.6.1",
        "llama-cpp-python==0.2.26",
        "chromadb==0.4.22",
        "python-dotenv==1.0.1",
        "pytest==8.0.0",
        "httpx==0.26.0",
    ],
) 