'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsForm() {
  const router = useRouter();
  const [azurePatToken, setAzurePatToken] = useState('');
  const [azureBoardUrl, setAzureBoardUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.azurePatToken) setAzurePatToken(data.azurePatToken);
        if (data.azureBoardUrl) setAzureBoardUrl(data.azureBoardUrl);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings', err);
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azurePatToken,
          azureBoardUrl
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      alert('Settings saved successfully!');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 13h10v10H2V13zM14 2h8v10h-8V2zM2 2h10v9H2V2zm12 12h8v9h-8v-9z"/>
        </svg>
        Azure DevOps Integration
      </h3>
      <p className="text-gray-500 mb-6 text-sm">
        Configure your Azure DevOps Personal Access Token (PAT) and Board URL. This allows the system to fetch ticket details directly from Azure DevOps.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Azure Board URL or Organization</label>
          <input
            type="text"
            placeholder="e.g. https://dev.azure.com/myorganization/myproject"
            value={azureBoardUrl}
            onChange={(e) => setAzureBoardUrl(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token (PAT)</label>
          <input
            type="password"
            placeholder="Enter your Azure DevOps PAT"
            value={azurePatToken}
            onChange={(e) => setAzurePatToken(e.target.value)}
            className="input-field w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            This token will be stored securely and used to authenticate requests to Azure DevOps.
          </p>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-btn h-10 px-6"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
