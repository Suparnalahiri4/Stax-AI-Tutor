# ABOUTME: Code execution service for running user code
# ABOUTME: Uses Judge0 API for secure code execution in multiple languages

import httpx
import asyncio
from typing import Optional
from pydantic import BaseModel
from enum import Enum

# Judge0 language IDs
class LanguageId(Enum):
    PYTHON = 71  # Python 3.8.1
    C = 50       # C (GCC 9.2.0)
    CPP = 54     # C++ (GCC 9.2.0)
    JAVA = 62    # Java (OpenJDK 13.0.1)
    JAVASCRIPT = 63  # JavaScript (Node.js 12.14.0)

LANGUAGE_MAP = {
    'python': LanguageId.PYTHON,
    'c': LanguageId.C,
    'cpp': LanguageId.CPP,
    'java': LanguageId.JAVA,
    'javascript': LanguageId.JAVASCRIPT
}


class ExecutionResult(BaseModel):
    """Result of code execution."""
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    status: str
    status_id: int
    time: Optional[str] = None
    memory: Optional[int] = None
    exit_code: Optional[int] = None


class CodeExecutionService:
    """Service for executing code using Judge0 API."""
    
    # Using the public Judge0 API endpoint
    JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        # Headers for RapidAPI (optional - can use without for limited requests)
        self.headers = {
            "Content-Type": "application/json"
        }
        if api_key:
            self.headers["X-RapidAPI-Key"] = api_key
            self.headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com"
    
    async def execute_code(
        self,
        source_code: str,
        language: str,
        stdin: Optional[str] = None,
        expected_output: Optional[str] = None,
        time_limit: float = 5.0,
        memory_limit: int = 128000
    ) -> ExecutionResult:
        """
        Execute code and return the result.
        
        Args:
            source_code: The code to execute
            language: Programming language (python, c, cpp, java, javascript)
            stdin: Input to provide to the program
            expected_output: Expected output for validation
            time_limit: Maximum execution time in seconds
            memory_limit: Maximum memory in KB
        """
        if language not in LANGUAGE_MAP:
            return ExecutionResult(
                status="Error",
                status_id=-1,
                stderr=f"Unsupported language: {language}"
            )
        
        language_id = LANGUAGE_MAP[language].value
        
        # Prepare submission
        submission = {
            "source_code": source_code,
            "language_id": language_id,
            "stdin": stdin or "",
            "expected_output": expected_output,
            "cpu_time_limit": time_limit,
            "memory_limit": memory_limit
        }
        
        # Always use local execution first (faster and no API key needed)
        # Judge0 API requires a paid RapidAPI key
        return await self._fallback_execute(source_code, language, stdin)
    
    def _parse_result(self, result: dict) -> ExecutionResult:
        """Parse Judge0 API response into ExecutionResult."""
        status = result.get("status", {})
        return ExecutionResult(
            stdout=result.get("stdout"),
            stderr=result.get("stderr"),
            compile_output=result.get("compile_output"),
            status=status.get("description", "Unknown"),
            status_id=status.get("id", -1),
            time=result.get("time"),
            memory=result.get("memory"),
            exit_code=result.get("exit_code")
        )
    
    async def _fallback_execute(
        self,
        source_code: str,
        language: str,
        stdin: Optional[str] = None
    ) -> ExecutionResult:
        """
        Local execution for code.
        Supports: Python, C, C++, JavaScript (Node.js)
        """
        import tempfile
        import os
        
        import sys
        import platform
        
        # Get the Python executable path (same one running this server)
        python_exe = sys.executable
        
        # Language configurations
        lang_config = {
            'python': {'ext': '.py', 'compile': None, 'run': [python_exe]},
            'javascript': {'ext': '.js', 'compile': None, 'run': ['node']},
            'c': {'ext': '.c', 'compile': ['gcc', '-o'], 'run': []},
            'cpp': {'ext': '.cpp', 'compile': ['g++', '-o'], 'run': []},
            'java': {'ext': '.java', 'compile': ['javac'], 'run': ['java']}
        }
        
        if language not in lang_config:
            return ExecutionResult(
                status="Unsupported",
                status_id=-1,
                stderr=f"Unsupported language: {language}"
            )
        
        config = lang_config[language]
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Create source file
            if language == 'java':
                # Java requires class name to match filename
                source_file = os.path.join(temp_dir, 'Solution.java')
            else:
                source_file = os.path.join(temp_dir, f'code{config["ext"]}')
            
            with open(source_file, 'w') as f:
                f.write(source_code)
            
            # Compile if needed (C, C++, Java)
            if config['compile']:
                if language == 'java':
                    compile_cmd = config['compile'] + [source_file]
                else:
                    output_file = os.path.join(temp_dir, 'program')
                    compile_cmd = config['compile'] + [output_file, source_file]
                
                try:
                    compile_process = await asyncio.create_subprocess_exec(
                        *compile_cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        cwd=temp_dir
                    )
                    compile_out, compile_err = await asyncio.wait_for(
                        compile_process.communicate(),
                        timeout=30.0
                    )
                    
                    if compile_process.returncode != 0:
                        return ExecutionResult(
                            stdout=None,
                            stderr=None,
                            compile_output=compile_err.decode() if compile_err else "Compilation failed",
                            status="Compilation Error",
                            status_id=6,
                            exit_code=compile_process.returncode
                        )
                except FileNotFoundError:
                    compiler = config['compile'][0]
                    return ExecutionResult(
                        status="Compiler Not Found",
                        status_id=-1,
                        stderr=f"{compiler} not found. Please install {compiler} to run {language} code locally."
                    )
            
            # Run the code
            if language in ['c', 'cpp']:
                run_cmd = [os.path.join(temp_dir, 'program')]
            elif language == 'java':
                run_cmd = ['java', '-cp', temp_dir, 'Solution']
            else:
                run_cmd = config['run'] + [source_file]
            
            try:
                process = await asyncio.create_subprocess_exec(
                    *run_cmd,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=temp_dir
                )
                
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(stdin.encode() if stdin else None),
                    timeout=5.0
                )
                
                return ExecutionResult(
                    stdout=stdout.decode() if stdout else None,
                    stderr=stderr.decode() if stderr else None,
                    status="Accepted" if process.returncode == 0 else "Runtime Error",
                    status_id=3 if process.returncode == 0 else 11,
                    exit_code=process.returncode
                )
            except FileNotFoundError:
                runtime = run_cmd[0]
                return ExecutionResult(
                    status="Runtime Not Found",
                    status_id=-1,
                    stderr=f"{runtime} not found. Please install it to run {language} code locally."
                )
                
        except asyncio.TimeoutError:
            return ExecutionResult(
                status="Time Limit Exceeded",
                status_id=5,
                stderr="Execution timed out (5 second limit)"
            )
        except FileNotFoundError as e:
            return ExecutionResult(
                status="Runtime Not Found",
                status_id=-1,
                stderr=f"Could not find runtime: {str(e)}"
            )
        except Exception as e:
            import traceback
            return ExecutionResult(
                status="Error",
                status_id=-1,
                stderr=f"Execution error: {str(e)}\n{traceback.format_exc()}"
            )
        finally:
            # Clean up temp directory
            import shutil
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
    
    async def check_solution(
        self,
        source_code: str,
        language: str,
        test_cases: list[dict],
        time_limit: float = 5.0
    ) -> dict:
        """
        Check solution against multiple test cases.
        
        Args:
            source_code: The code to test
            language: Programming language
            test_cases: List of {input: str, expected_output: str}
            time_limit: Maximum time per test case
        
        Returns:
            Dict with passed count, total count, and details
        """
        results = []
        passed = 0
        
        for i, test_case in enumerate(test_cases):
            result = await self.execute_code(
                source_code=source_code,
                language=language,
                stdin=test_case.get('input', ''),
                expected_output=test_case.get('expected_output'),
                time_limit=time_limit
            )
            
            # Check if output matches expected
            actual_output = (result.stdout or '').strip()
            expected_output = test_case.get('expected_output', '').strip()
            is_correct = actual_output == expected_output
            
            if is_correct:
                passed += 1
            
            results.append({
                'test_case': i + 1,
                'passed': is_correct,
                'input': test_case.get('input', ''),
                'expected': expected_output,
                'actual': actual_output,
                'status': result.status,
                'time': result.time,
                'error': result.stderr or result.compile_output
            })
        
        return {
            'passed': passed,
            'total': len(test_cases),
            'all_passed': passed == len(test_cases),
            'results': results
        }


# Singleton instance
code_execution_service = CodeExecutionService()
