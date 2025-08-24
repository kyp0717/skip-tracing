# Project Plan

## Architecture

This project is a Python-based skip tracing tool. It appears to be designed to take a list of properties, extract addresses, and then use an API to find contact information for the owners.

- `main.py`: The main entry point of the application.
- `config.py`: Handles configuration management.
- `extract_addresses.py`: Extracts addresses from a CSV file.
- `src/`: Contains the core logic of the application.
  - `api_client.py`: Interacts with an external API for skip tracing.
  - `skip_tracer.py`: The main skip tracing logic.
  - `utils.py`: Utility functions.
- `data/`: Contains input and output data.
- `tests/`: Contains tests for the application.

## Style

- The project follows standard Python conventions.
- The coding style should be consistent with the existing code.

## Constraints

- The project should be developed using Python.
- All new features should be accompanied by tests.
- The project should be well-documented.
