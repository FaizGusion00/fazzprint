import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Clock, 
  Shield, 
  Zap,
  Star,
  Users
} from 'lucide-react'

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Track your orders from submission to completion with live updates and notifications.'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Professional quality printing with satisfaction guarantee on all orders.'
    },
    {
      icon: Zap,
      title: 'Fast Turnaround',
      description: 'Quick processing and delivery to meet your urgent printing needs.'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: '24/7 customer support from our team of printing professionals.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Director',
      content: 'FazzPrint delivers exceptional quality and service. Their real-time tracking system gives us complete visibility into our orders.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Small Business Owner',
      content: 'Fast, reliable, and professional. FazzPrint has become our go-to printing partner for all business materials.',
      rating: 5
    },
    {
      name: 'Emma Davis',
      role: 'Event Coordinator',
      content: 'The quality is outstanding and delivery is always on time. Highly recommend for any printing needs.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Printing
              <span className="block text-primary-200">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Create, track, and receive high-quality print materials with our streamlined 
              customer portal and real-time order management system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FazzPrint?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the difference with our modern printing services and customer-first approach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-lg mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600">
              Professional printing solutions for all your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Business Cards',
                description: 'Premium business cards with various finishes and materials',
                image: '🎴'
              },
              {
                title: 'Brochures & Flyers',
                description: 'Eye-catching marketing materials in multiple formats',
                image: '📄'
              },
              {
                title: 'Banners & Signage',
                description: 'Large format printing for events and advertising',
                image: '🪧'
              },
              {
                title: 'Stationery',
                description: 'Letterheads, envelopes, and branded stationery',
                image: '📝'
              },
              {
                title: 'Catalogs & Books',
                description: 'Multi-page documents with professional binding',
                image: '📚'
              },
              {
                title: 'Custom Projects',
                description: 'Specialized printing for unique requirements',
                image: '🎨'
              }
            ].map((service, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{service.image}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-gray-600">
              From order to delivery in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Upload & Specify',
                description: 'Upload your files and specify your printing requirements'
              },
              {
                step: '02',
                title: 'Review & Approve',
                description: 'Our team reviews your order and provides a quote'
              },
              {
                step: '03',
                title: 'Print & Quality Check',
                description: 'Professional printing with comprehensive quality control'
              },
              {
                step: '04',
                title: 'Deliver & Track',
                description: 'Fast delivery with real-time tracking updates'
              }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
                  {process.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {process.title}
                </h3>
                <p className="text-gray-600">
                  {process.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of satisfied customers who trust FazzPrint for their printing needs.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors group"
          >
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage 