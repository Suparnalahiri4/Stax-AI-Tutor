// ABOUTME: Monaco-based code editor component with language selection
// ABOUTME: Supports Python, C, C++, Java, JavaScript for DSA questions

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, RotateCcw, Check, AlertCircle } from 'lucide-react'

export type SupportedLanguage = 'python' | 'c' | 'cpp' | 'java' | 'javascript'

interface LanguageConfig {
  id: SupportedLanguage
  label: string
  monacoLanguage: string
  defaultCode: string
}

const LANGUAGES: LanguageConfig[] = [
  {
    id: 'python',
    label: 'Python',
    monacoLanguage: 'python',
    defaultCode: `def solution(arr):
    """
    Write your solution here.
    
    Args:
        arr: Input array/list
    
    Returns:
        Your result
    """
    # Your code here
    pass


# Test your solution
if __name__ == "__main__":
    # Example test
    result = solution([1, 2, 3, 4, 5])
    print(result)
`
  },
  {
    id: 'cpp',
    label: 'C++',
    monacoLanguage: 'cpp',
    defaultCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// Write your solution function here
vector<int> solution(vector<int>& arr) {
    // Your code here
    
    return arr;
}

int main() {
    vector<int> arr = {1, 2, 3, 4, 5};
    vector<int> result = solution(arr);
    
    for (int x : result) {
        cout << x << " ";
    }
    cout << endl;
    
    return 0;
}
`
  },
  {
    id: 'c',
    label: 'C',
    monacoLanguage: 'c',
    defaultCode: `#include <stdio.h>
#include <stdlib.h>

// Write your solution function here
int solution(int arr[], int n) {
    // Your code here
    
    return 0;
}

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int n = 5;
    
    int result = solution(arr, n);
    printf("%d\\n", result);
    
    return 0;
}
`
  },
  {
    id: 'java',
    label: 'Java',
    monacoLanguage: 'java',
    defaultCode: `import java.util.*;

public class Solution {
    
    // Write your solution method here
    public static int solution(int[] arr) {
        // Your code here
        
        return 0;
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int result = solution(arr);
        System.out.println(result);
    }
}
`
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    defaultCode: `/**
 * Write your solution here.
 * @param {number[]} arr - Input array
 * @returns {number} - Your result
 */
function solution(arr) {
    // Your code here
    
}

// Test your solution
const arr = [1, 2, 3, 4, 5];
const result = solution(arr);
console.log(result);
`
  }
]

interface CodeEditorProps {
  onRun: (code: string, language: SupportedLanguage) => void
  onSubmit: (code: string, language: SupportedLanguage) => void
  isRunning?: boolean
  isSubmitting?: boolean
  output?: string
  disabled?: boolean
}

export default function CodeEditor({
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
  output,
  disabled = false
}: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python')
  const [code, setCode] = useState<string>(LANGUAGES[0].defaultCode)
  const [editorLoaded, setEditorLoaded] = useState(false)
  const [editorError, setEditorError] = useState(false)

  const currentLanguageConfig = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0]

  // Update code when language changes
  useEffect(() => {
    const langConfig = LANGUAGES.find(l => l.id === selectedLanguage)
    if (langConfig) {
      setCode(langConfig.defaultCode)
    }
  }, [selectedLanguage])

  const handleLanguageChange = (langId: SupportedLanguage) => {
    setSelectedLanguage(langId)
  }

  const handleReset = () => {
    setCode(currentLanguageConfig.defaultCode)
  }

  const handleEditorMount = () => {
    setEditorLoaded(true)
    setEditorError(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-4">
          <label className="text-gray-300 text-sm">Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm border border-gray-600 focus:outline-none focus:border-primary-500"
            disabled={disabled}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md text-sm transition-colors disabled:opacity-50"
            title="Reset code"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => onRun(code, selectedLanguage)}
            disabled={isRunning || isSubmitting || disabled}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={() => onSubmit(code, selectedLanguage)}
            disabled={isRunning || isSubmitting || disabled}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="border-x border-gray-700 bg-[#1e1e1e]" style={{ height: '400px' }}>
        {editorError ? (
          // Fallback textarea if Monaco fails to load
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 p-2 bg-yellow-900/50 text-yellow-200 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Monaco editor failed to load. Using simple editor.</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full bg-[#1e1e1e] text-gray-200 font-mono text-sm p-4 resize-none focus:outline-none"
              disabled={disabled}
              spellCheck={false}
            />
          </div>
        ) : (
          <Editor
            height="400px"
            language={currentLanguageConfig.monacoLanguage}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            loading={
              <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  <span>Loading editor...</span>
                </div>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 16 },
              readOnly: disabled
            }}
          />
        )}
      </div>

      {/* Output Panel */}
      <div className="bg-gray-900 border border-gray-700 rounded-b-lg">
        <div className="px-4 py-2 border-b border-gray-700">
          <span className="text-gray-400 text-sm font-medium">Output</span>
        </div>
        <div className="p-4 min-h-[120px] max-h-[200px] overflow-auto">
          {output ? (
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{output}</pre>
          ) : (
            <p className="text-gray-500 text-sm">Run your code to see output here...</p>
          )}
        </div>
      </div>
    </div>
  )
}
