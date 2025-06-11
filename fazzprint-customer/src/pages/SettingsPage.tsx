import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Settings, 
  Info,
  Save,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import SessionStatus from '@/components/SessionStatus'
import toast from 'react-hot-toast'
import { apiService } from '@/services/api'
// import SavedCredentialsManager from '@/components/SavedCredentialsManager'

interface SystemSettings {
  items_per_page: number
  auto_refresh: boolean
  auto_refresh_interval: number
  session_timeout: number
}

const SettingsPage: React.FC = () => {
  const { extendSession } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('general')

  // Load current settings from backend
  const { data: settingsResponse, isLoading: settingsLoading } = useQuery(
    ['user-settings'],
    () => apiService.get<{ settings: SystemSettings }>('/auth/settings'),
    {
      onError: () => {
        // If no settings exist, use defaults
        setSettings({
          items_per_page: 20,
          auto_refresh: true,
          auto_refresh_interval: 30,
          session_timeout: 30
        })
      }
    }
  )

  const [settings, setSettings] = useState<SystemSettings>({
    items_per_page: 20,
    auto_refresh: true,
    auto_refresh_interval: 30,
    session_timeout: 30
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Update local state when backend data loads
  React.useEffect(() => {
    if (settingsResponse?.data?.settings) {
      setSettings(settingsResponse.data.settings)
    }
  }, [settingsResponse])

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  // Save settings mutation
  const saveSettingsMutation = useMutation(
    (data: SystemSettings) => apiService.put('/auth/settings', data),
    {
      onSuccess: () => {
        toast.success('Settings saved successfully!')
        setHasChanges(false)
        queryClient.invalidateQueries(['user-settings'])
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to save settings')
      }
    }
  )

  const saveSettings = () => {
    saveSettingsMutation.mutate(settings)
  }

  const resetToDefaults = () => {
    setSettings({
      items_per_page: 20,
      auto_refresh: true,
      auto_refresh_interval: 30,
      session_timeout: 30
    })
    setHasChanges(true)
    toast.success('Settings reset to defaults')
  }

  const sections = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'session', name: 'Session', icon: RefreshCw },
    { id: 'about', name: 'About', icon: Info }
  ]

  if (settingsLoading) {
    return <LoadingSpinner text="Loading settings..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">System Settings</h1>
        <p className="text-gray-200">
          Customize your FazzPrint experience and manage system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="font-medium text-gray-900 mb-4">Settings</h2>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            
            {/* General Settings */}
            {activeSection === 'general' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Items per page
                      </label>
                      <select
                        value={settings.items_per_page}
                        onChange={(e) => handleSettingChange('items_per_page', parseInt(e.target.value))}
                        className="input"
                      >
                        <option value={10}>10 items</option>
                        <option value={20}>20 items</option>
                        <option value={50}>50 items</option>
                        <option value={100}>100 items</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session timeout (minutes)
                      </label>
                      <select
                        value={settings.session_timeout}
                        onChange={(e) => handleSettingChange('session_timeout', parseInt(e.target.value))}
                        className="input"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.auto_refresh}
                        onChange={(e) => handleSettingChange('auto_refresh', e.target.checked)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-refresh data</span>
                    </label>
                    {settings.auto_refresh && (
                      <div className="mt-2 ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Refresh interval (seconds)
                        </label>
                        <select
                          value={settings.auto_refresh_interval}
                          onChange={(e) => handleSettingChange('auto_refresh_interval', parseInt(e.target.value))}
                          className="input w-48"
                        >
                          <option value={15}>15 seconds</option>
                          <option value={30}>30 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={300}>5 minutes</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Session Section */}
            {activeSection === 'session' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Session Management</h3>
                
                <div className="space-y-6">
                  {/* Current Session Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Current Session Status</h4>
                    <SessionStatus showDetails={true} className="mb-4" />
                  </div>

                  {/* Session Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-3 flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      How Sessions Work
                    </h5>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>• Sessions automatically last for <strong>2 days maximum</strong> from login</p>
                      <p>• Your session extends automatically when you're active on the platform</p>
                      <p>• Sessions are stored securely in your browser with encryption</p>
                      <p>• You can manually log out anytime to end your session immediately</p>
                      <p>• Inactive sessions expire automatically for security</p>
                    </div>
                  </div>

                  {/* Session Actions */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Session Actions</h5>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          extendSession();
                          toast.success('Session extended successfully!');
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Extend Session Now
                      </button>
                      <p className="text-xs text-gray-500">
                        Manually extend your session if you plan to be active for an extended period.
                      </p>
                    </div>
                  </div>

                  {/* Saved Credentials Management */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Remember Me Credentials</h5>
                    <p className="text-sm text-gray-500">
                      Credential management coming soon. Currently saved credentials are managed automatically.
                    </p>
                  </div>

                  {/* Security Tips */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-800 mb-3">Security Best Practices</h5>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>• Always log out when using shared or public computers</p>
                      <p>• Don't save login credentials on untrusted devices</p>
                      <p>• Close browser tabs when finished to prevent unauthorized access</p>
                      <p>• Report any suspicious activity to our support team immediately</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Section */}
            {activeSection === 'about' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">About FazzPrint</h3>
                
                <div className="space-y-6">
                  {/* Company Overview */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-xl font-bold text-gray-900">FazzPrint</h4>
                        <p className="text-sm text-gray-600">Professional Printing Management System</p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      FazzPrint is a comprehensive digital printing management solution designed specifically for businesses and individuals 
                      in Malaysia. Our platform combines cutting-edge technology with traditional printing expertise to deliver 
                      exceptional results for all your printing needs.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Founded with the vision of revolutionizing the printing industry in Southeast Asia, we provide high-quality 
                      printing services with competitive Malaysian pricing, excellent customer service, and innovative digital solutions.
                    </p>
                  </div>

                  {/* Services Overview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Info className="h-4 w-4 text-blue-600" />
                      </div>
                      Our Services
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-800">Document Printing</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Business documents and reports</li>
                          <li>• Marketing materials and brochures</li>
                          <li>• Presentations and proposals</li>
                          <li>• Academic papers and theses</li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-800">Custom Apparel</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Custom t-shirt printing</li>
                          <li>• Corporate uniforms</li>
                          <li>• Event merchandise</li>
                          <li>• Promotional clothing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Version Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                        <div className="h-6 w-6 bg-green-100 rounded flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-green-600">v</span>
                        </div>
                        Version Information
                      </h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Application Version:</span>
                          <span className="font-mono text-green-600">v1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Build Date:</span>
                          <span>{new Date().toLocaleDateString('en-MY')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Environment:</span>
                          <span className="text-green-600">Production</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span>{new Date().toLocaleDateString('en-MY')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                        <div className="h-6 w-6 bg-blue-100 rounded flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-blue-600">@</span>
                        </div>
                        Contact Information
                      </h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div><strong>Email:</strong> support@fazzprint.com</div>
                        <div><strong>Phone:</strong> +60 3-1234 5678</div>
                        <div><strong>WhatsApp:</strong> +60 12-345 6789</div>
                        <div><strong>Address:</strong> Menara FazzPrint, Jalan Bukit Bintang, 55100 Kuala Lumpur, Malaysia</div>
                        <div><strong>Website:</strong> www.fazzprint.com</div>
                        <div><strong>Operating Hours:</strong> Mon-Fri 9AM-6PM, Sat 9AM-1PM</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-800 mb-3 flex items-center">
                      <div className="h-6 w-6 bg-yellow-200 rounded flex items-center justify-center mr-2">
                        <span className="text-xs font-bold text-yellow-800">RM</span>
                      </div>
                      Malaysian Pricing (MYR)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm text-yellow-700 space-y-1">
                        <h6 className="font-medium">Document Printing:</h6>
                        <div>• A4 B&W: RM 0.50 per page</div>
                        <div>• A4 Color: RM 1.50 per page</div>
                        <div>• A3 B&W: RM 1.00 per page</div>
                        <div>• A3 Color: RM 3.00 per page</div>
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <h6 className="font-medium">T-shirt Printing:</h6>
                        <div>• Basic Design: RM 35 per piece</div>
                        <div>• Custom Design: RM 40 per piece</div>
                        <div>• Premium Quality: RM 45 per piece</div>
                        <div>• Bulk Orders: Up to 15% discount</div>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      * All prices in Malaysian Ringgit (MYR). Volume discounts available for bulk orders.
                    </p>
                  </div>

                  {/* System Features */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-3 flex items-center">
                      <div className="h-6 w-6 bg-blue-200 rounded flex items-center justify-center mr-2">
                        <span className="text-xs font-bold text-blue-800">✓</span>
                      </div>
                      Platform Features
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-sm text-blue-700 space-y-1">
                        <h6 className="font-medium">Order Management:</h6>
                        <div>✓ Real-time order tracking</div>
                        <div>✓ Automated cost estimation</div>
                        <div>✓ File upload and management</div>
                        <div>✓ Order history and analytics</div>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <h6 className="font-medium">Communication:</h6>
                        <div>✓ Smart notification system</div>
                        <div>✓ Email and SMS updates</div>
                        <div>✓ Live chat support</div>
                        <div>✓ Progress notifications</div>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <h6 className="font-medium">Security & Payment:</h6>
                        <div>✓ Secure file handling</div>
                        <div>✓ Encrypted data storage</div>
                        <div>✓ Multiple payment options</div>
                        <div>✓ Malaysian banking integration</div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="h-6 w-6 bg-gray-200 rounded flex items-center justify-center mr-2">
                        <span className="text-xs font-bold text-gray-600">⚙</span>
                      </div>
                      Technical Specifications
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm text-gray-600 space-y-1">
                        <h6 className="font-medium text-gray-800">Supported File Formats:</h6>
                        <div>• Documents: PDF, DOC, DOCX, RTF</div>
                        <div>• Presentations: PPT, PPTX</div>
                        <div>• Images: JPG, PNG, GIF, SVG</div>
                        <div>• Design Files: AI, PSD, EPS</div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <h6 className="font-medium text-gray-800">System Requirements:</h6>
                        <div>• Modern web browser (Chrome, Firefox, Safari)</div>
                        <div>• Internet connection required</div>
                        <div>• Maximum file size: 50MB per file</div>
                        <div>• Mobile-friendly responsive design</div>
                      </div>
                    </div>
                  </div>

                  {/* Company Values */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="h-6 w-6 bg-green-200 rounded flex items-center justify-center mr-2">
                        <span className="text-xs font-bold text-green-600">♥</span>
                      </div>
                      Our Commitment
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div className="text-center">
                        <div className="font-medium text-green-700 mb-1">Quality Excellence</div>
                        <div>We use premium materials and state-of-the-art printing technology to ensure every order meets the highest standards.</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-700 mb-1">Malaysian Values</div>
                        <div>Supporting local businesses with competitive pricing, friendly service, and understanding of Malaysian market needs.</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-700 mb-1">Innovation</div>
                        <div>Continuously improving our platform with the latest technology to provide seamless printing solutions.</div>
                      </div>
                    </div>
                  </div>

                  {/* Support Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Need Help?</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <h6 className="font-medium text-gray-800 mb-2">Customer Support:</h6>
                        <div>• 24/7 online chat support</div>
                        <div>• Email support: support@fazzprint.com</div>
                        <div>• Phone support: +60 3-1234 5678</div>
                        <div>• FAQ and knowledge base available</div>
                      </div>
                      <div>
                        <h6 className="font-medium text-gray-800 mb-2">Quick Links:</h6>
                        <div>• User manual and tutorials</div>
                        <div>• Pricing calculator</div>
                        <div>• File preparation guidelines</div>
                        <div>• Order tracking help</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show for General Settings */}
            {activeSection === 'general' && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={resetToDefaults}
                  className="btn btn-outline"
                  disabled={saveSettingsMutation.isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </button>

                <div className="flex items-center space-x-3">
                  {hasChanges && (
                    <span className="text-sm text-orange-600 font-medium">
                      You have unsaved changes
                    </span>
                  )}
                  <button
                    onClick={saveSettings}
                    disabled={!hasChanges || saveSettingsMutation.isLoading}
                    className={`btn btn-primary ${(!hasChanges || saveSettingsMutation.isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 