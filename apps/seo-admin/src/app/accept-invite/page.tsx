"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
        setError("Missing token.");
        return;
    }

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  if (!token) {
      return <div className="p-8 text-center text-red-600">Missing invitation token.</div>;
  }

  if (success) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Invitation Accepted!</h2>
              <p>You can now log in. Redirecting...</p>
            </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Set Up Your Account</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border rounded-md p-2" 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Accept Invitation
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AcceptInviteForm />
        </Suspense>
    );
}
