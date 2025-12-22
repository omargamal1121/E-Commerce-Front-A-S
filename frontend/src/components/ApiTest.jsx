import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const ApiTest = () => {
  const { backendUrl } = useContext(ShopContext);
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState('products');

  const testApiConnection = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      let response, data;
      
      if (testType === 'products') {
        // Test the products endpoint
        response = await fetch(`${backendUrl}/api/Products?page=1&pageSize=5`);
        data = await response.json();
        
        if (response.ok) {
          setTestResult(`✅ Products API Test Successful!\nStatus: ${response.status}\nProducts found: ${data?.responseBody?.data?.length || 0}`);
        } else {
          setTestResult(`❌ Products API Error\nStatus: ${response.status}\nMessage: ${data?.responseBody?.message || 'Unknown error'}`);
        }
      } else if (testType === 'login') {
        // Test login with dummy credentials
        response = await fetch(`${backendUrl}/api/Account/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'test123'
          })
        });
        
        data = await response.json();
        
        if (response.ok) {
          setTestResult(`✅ Login API Test Successful!\nStatus: ${response.status}\nToken received: ${data?.responseBody?.data?.token ? 'Yes' : 'No'}`);
        } else {
          setTestResult(`❌ Login API Error\nStatus: ${response.status}\nMessage: ${data?.responseBody?.message || 'Unknown error'}\nFull Response: ${JSON.stringify(data, null, 2)}`);
        }
      } else if (testType === 'register') {
        // Test registration
        response = await fetch(`${backendUrl}/api/Account/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: 'Test User',
            userName: 'testuser',
            phoneNumber: '1234567890',
            age: 25,
            email: 'test@example.com',
            password: 'Test123!',
            confirmPassword: 'Test123!'
          })
        });
        
        data = await response.json();
        
        if (response.ok) {
          setTestResult(`✅ Registration API Test Successful!\nStatus: ${response.status}\nMessage: ${data?.responseBody?.message || 'User registered'}`);
        } else {
          setTestResult(`❌ Registration API Error\nStatus: ${response.status}\nMessage: ${data?.responseBody?.message || 'Unknown error'}\nFull Response: ${JSON.stringify(data, null, 2)}`);
        }
      } else if (testType === 'categories') {
        // Test categories endpoint
        response = await fetch(`${backendUrl}/api/categories`);
        data = await response.json();
        
        if (response.ok) {
          setTestResult(`✅ Categories API Test Successful!\nStatus: ${response.status}\nCategories found: ${data?.responseBody?.data?.length || 0}`);
        } else {
          setTestResult(`❌ Categories API Error\nStatus: ${response.status}\nMessage: ${data?.responseBody?.message || 'Unknown error'}\nFull Response: ${JSON.stringify(data, null, 2)}`);
        }
      } else if (testType === 'subcategories') {
        // Test subcategories endpoint
        response = await fetch(`${backendUrl}/api/subcategories`);
        data = await response.json();
        
        if (response.ok) {
          setTestResult(`✅ Subcategories API Test Successful!\nStatus: ${response.status}\nSubcategories found: ${data?.responseBody?.data?.length || 0}`);
        } else {
          setTestResult(`❌ Subcategories API Error\nStatus: ${response.status}\nMessage: ${data?.responseBody?.message || 'Unknown error'}\nFull Response: ${JSON.stringify(data, null, 2)}`);
        }
      }
    } catch (error) {
      setTestResult(`❌ Connection Failed\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">API Connection Test</h3>
      <p className="text-sm text-gray-600 mb-4">Backend URL: {backendUrl}</p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Test Type:</label>
        <select 
          value={testType} 
          onChange={(e) => setTestType(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="products">Products API</option>
          <option value="login">Login API</option>
          <option value="register">Registration API</option>
          <option value="categories">Categories API</option>
          <option value="subcategories">Subcategories API</option>
        </select>
      </div>
      
      <button 
        onClick={testApiConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-white border rounded">
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
