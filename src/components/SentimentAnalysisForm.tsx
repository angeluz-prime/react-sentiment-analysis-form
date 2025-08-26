import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFaceFrown, 
  faFaceMeh, 
  faFaceGrinBeam,
  faCheckCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

interface Emoji {
  value: number;
  label: string;
  iconColor: string;
  iconSize: string;
  ringColor: string;
  bgColor: string;
}

interface FeedbackData {
  rating: number;
  feedback: string;
  name: string;
  email: string;
  timestamp: string;
}

interface FormErrors {
  feedback?: string;
  name?: string;
  email?: string;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
}

const EmojiRatingForm: React.FC = () => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    feedback: false,
    name: false,
    email: false
  });
  const [submitError, setSubmitError] = useState<string>('');

  // Webhook URL - replace with your actual webhook URL
  // Using a direct URL instead of process.env to avoid TypeScript errors
  // Webhook URL - safest approach using Vite's environment variables
  const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error('Webhook URL is not defined. Please set VITE_WEBHOOK_URL environment variable.');
    // You might want to handle this error more gracefully in production
  }

  const emojis: Emoji[] = [
    { 
      value: 1, 
      label: 'Unsatisfied', 
      iconColor: '#E3424D', 
      iconSize: '45px', 
      ringColor: '#E3424D',
      bgColor: '#FEEBEE'
    },
    { 
      value: 2, 
      label: 'Neutral', 
      iconColor: '#FCC418', 
      iconSize: '45px', 
      ringColor: '#FCC418',
      bgColor: '#FFF8E1'
    },
    { 
      value: 3, 
      label: 'Satisfied', 
      iconColor: '#2EB578', 
      iconSize: '45px', 
      ringColor: '#2EB578',
      bgColor: '#E6F4EE'
    }
  ];

  // Webhook submission function
  const submitToWebhook = async (data: FeedbackData): Promise<WebhookResponse> => {
    if (!WEBHOOK_URL) {
      return {
        success: false,
        message: 'Webhook configuration error. Please try again later.'
      };
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
      }

      // Don't try to parse the response, just check if it was successful
      return { success: true, message: 'Feedback submitted successfully' };
    } catch (error) {
      console.error('Webhook submission failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to submit feedback' 
      };
    }
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!feedback.trim()) {
      newErrors.feedback = 'Feedback is required';
    } else if (feedback.trim().length < 10) {
      newErrors.feedback = 'Feedback must be at least 10 characters';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const renderEmojiSVG = (rating: number): React.ReactElement => {
    const emoji = emojis[rating - 1];
    
    let icon;
    switch(rating) {
      case 1:
        icon = <FontAwesomeIcon icon={faFaceFrown} style={{ color: emoji.iconColor, fontSize: emoji.iconSize }} />;
        break;
      case 2:
        icon = <FontAwesomeIcon icon={faFaceMeh} style={{ color: emoji.iconColor, fontSize: emoji.iconSize }} />;
        break;
      case 3:
        icon = <FontAwesomeIcon icon={faFaceGrinBeam} style={{ color: emoji.iconColor, fontSize: emoji.iconSize }} />;
        break;
      default:
        icon = <FontAwesomeIcon icon={faFaceMeh} style={{ color: emoji.iconColor, fontSize: emoji.iconSize }} />;
    }
    
    return (
      <div className="w-16 h-16 rounded-full flex items-center justify-center">
        {icon}
      </div>
    );
  };

  const handleSubmit = async (): Promise<void> => {
    // Mark all fields as touched to show errors
    setTouched({
      feedback: true,
      name: true,
      email: true
    });

    if (validateForm() && selectedRating) {
      setIsLoading(true);
      setSubmitError('');
      
      const feedbackData: FeedbackData = {
        rating: selectedRating,
        feedback: feedback.trim(),
        name: name.trim(),
        email: email.trim(),
        timestamp: new Date().toISOString()
      };
      
      try {
        // Submit to webhook
        const result = await submitToWebhook(feedbackData);
        
        if (result.success) {
          console.log('Feedback submitted successfully:', feedbackData);
          setIsSubmitted(true);
        } else {
          setSubmitError(result.message || 'Failed to submit feedback');
        }
      } catch (error) {
        console.error('Submission error:', error);
        setSubmitError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReset = (): void => {
    setSelectedRating(null);
    setFeedback('');
    setName('');
    setEmail('');
    setIsSubmitted(false);
    setErrors({});
    setSubmitError('');
    setTouched({
      feedback: false,
      name: false,
      email: false
    });
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 m-4 border border-gray-100">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
          <button
            onClick={handleReset}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 font-medium"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 m-4 border border-gray-100">
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            How was your experience?
          </h2>
          <p className="text-gray-600">
            Please rate your overall satisfaction
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full ${
                  (step === 1 && selectedRating !== null) ||
                  (step === 2 && feedback.trim() !== '') ||
                  (step === 3 && name.trim() !== '' && email.trim() !== '')
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Emoji Rating Section */}
        <div className="mb-8">
          <div className="flex justify-center space-x-6 mb-4">
            {emojis.map((item: Emoji) => {
              const isSelected = selectedRating === item.value;
              const isHovered = hoveredRating === item.value;
              
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedRating(item.value)}
                  onMouseEnter={() => setHoveredRating(item.value)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className={`p-3 rounded-full transition-all duration-300 hover:scale-110 outline-none hover:outline-none focus:outline-none ${
                    isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                  style={(isSelected || isHovered) ? { 
                    boxShadow: `0 0 0 3px ${item.ringColor}, 0 4px 12px rgba(0,0,0,0.1)`,
                    transform: (isSelected || isHovered) ? 'scale(1.1)' : 'scale(1)',
                    backgroundColor: (isSelected || isHovered) ? item.bgColor : 'transparent'
                  } : {}}
                  title={item.label}
                  aria-label={`Rate ${item.label}`}
                >
                  {renderEmojiSVG(item.value)}
                </button>
              );
            })}
          </div>
          
          {selectedRating && (
            <div className="text-center">
              <span 
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{ 
                  color: emojis[selectedRating - 1]?.ringColor,
                  backgroundColor: emojis[selectedRating - 1]?.bgColor
                }}
              >
                {emojis[selectedRating - 1]?.label}
              </span>
            </div>
          )}
        </div>

        {/* Text Area Section - Only show after rating is selected */}
        {selectedRating && (
          <div className="mb-6 transition-all duration-500 ease-in-out">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Please share what worked well or what could be improved
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
              onBlur={() => handleBlur('feedback')}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none focus:outline-none transition-colors ${
                touched.feedback && errors.feedback 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              rows={4}
              placeholder="Your detailed feedback helps us improve our service..."
            />
            {touched.feedback && errors.feedback && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                <span>{errors.feedback}</span>
              </div>
            )}
          </div>
        )}

        {/* Contact Information Section - Only show after feedback text is provided */}
        {selectedRating && feedback.trim() && (
          <div className="mb-6 transition-all duration-500 ease-in-out">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm text-left font-medium text-gray-700 mb-2">
                  Name/Company Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent focus:outline-none transition-colors ${
                    touched.name && errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your name or company name"
                />
                {touched.name && errors.name && (
                  <div className="flex items-center mt-1 text-red-500 text-sm">
                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-left font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent focus:outline-none transition-colors ${
                    touched.email && errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email address"
                />
                {touched.email && errors.email && (
                  <div className="flex items-center mt-1 text-red-500 text-sm">
                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button - Only show when all previous fields are completed */}
        {selectedRating && feedback.trim() && name.trim() && email.trim() && (
          <div className="transition-all duration-500 ease-in-out">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Feedback'}
            </button>
            
            {/* Error message for webhook submission */}
            {submitError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700 text-sm">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                  <span>{submitError}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Helper text */}
        <div className="mt-4 text-center">
          {!selectedRating && (
            <p className="text-sm text-gray-500">
              👆 Please select a rating to continue
            </p>
          )}
          
          {selectedRating && !feedback.trim() && (
            <p className="text-sm text-gray-500">
              ✏️ Please provide your feedback to continue
            </p>
          )}
          
          {selectedRating && feedback.trim() && (!name.trim() || !email.trim()) && (
            <p className="text-sm text-gray-500">
              📝 Please fill in your contact information to submit
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmojiRatingForm;