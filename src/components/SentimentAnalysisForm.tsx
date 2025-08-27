import React, { useState, useEffect } from 'react';
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
  bgColorDark: string;
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
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Webhook URL - replace with your actual webhook URL
  const WEBHOOK_URL = import.meta.env?.VITE_WEBHOOK_URL || '';

  if (!WEBHOOK_URL) {
    console.error('Webhook URL is not defined. Please set VITE_WEBHOOK_URL environment variable.');
  }

  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const emojis: Emoji[] = [
    { 
      value: 1, 
      label: 'Unsatisfied', 
      iconColor: '#E3424D', 
      iconSize: '45px', 
      ringColor: '#E3424D',
      bgColor: '#FEEBEE',
      bgColorDark: 'rgba(227, 66, 77, 0.15)'
    },
    { 
      value: 2, 
      label: 'Neutral', 
      iconColor: '#FCC418', 
      iconSize: '45px', 
      ringColor: '#FCC418',
      bgColor: '#FFF8E1',
      bgColorDark: 'rgba(252, 196, 24, 0.15)'
    },
    { 
      value: 3, 
      label: 'Satisfied', 
      iconColor: '#2EB578', 
      iconSize: '45px', 
      ringColor: '#2EB578',
      bgColor: '#E6F4EE',
      bgColorDark: 'rgba(46, 181, 120, 0.15)'
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

  // Check if form is valid and should show submit button
  const checkFormValidity = (): boolean => {
    if (!selectedRating || !feedback.trim() || !name.trim() || !email.trim()) {
      return false;
    }

    const hasErrors = feedback.trim().length < 10 || !validateEmail(email);
    return !hasErrors;
  };

  // Update form validity whenever relevant fields change
  useEffect(() => {
    const isValid = checkFormValidity();
    setIsFormValid(isValid);
  }, [selectedRating, feedback, name, email]);

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
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">
        {icon}
      </div>
    );
  };

  const handleSubmit = async (): Promise<void> => {
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
    setIsFormValid(false);
    setTouched({
      feedback: false,
      name: false,
      email: false
    });
  };

  // Dynamic class helpers for dark mode
  const containerClasses = `min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-200`;

  const cardClasses = `w-full max-w-sm mx-auto rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 border transition-colors duration-200 ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-100'
  }`;

  const textClasses = `transition-colors duration-200 ${
    isDarkMode ? 'text-gray-100' : 'text-gray-800'
  }`;

  const subtextClasses = `transition-colors duration-200 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-600'
  }`;

  const labelClasses = `block text-sm font-medium transition-colors duration-200 text-left ${
    isDarkMode ? 'text-gray-200' : 'text-gray-700'
  } mb-2`;

  const inputClasses = (hasError: boolean) => 
    `w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent focus:outline-none transition-all duration-200 text-sm sm:text-base ${
      hasError
        ? 'border-red-500 focus:ring-red-500'
        : isDarkMode
        ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500'
        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500'
    }`;

  const textareaClasses = (hasError: boolean) =>
    `w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none focus:outline-none transition-all duration-200 text-sm sm:text-base ${
      hasError
        ? 'border-red-500 focus:ring-red-500'
        : isDarkMode
        ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500'
        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500'
    }`;

  const helperTextClasses = `text-xs sm:text-sm transition-colors duration-200 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-500'
  } italic`;

  if (isSubmitted) {
    return (
      <div className={containerClasses}>
        <div className={cardClasses}>
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl" />
              </div>
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${textClasses}`}>Thank You!</h2>
            <p className={`text-sm sm:text-base mb-6 ${subtextClasses}`}>
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <button
              onClick={handleReset}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 font-medium text-sm sm:text-base"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <div>
          <div className="text-center mb-4 sm:mb-6">
            <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${textClasses}`}>
              How was your experience?
            </h2>
            <p className={`text-sm sm:text-base ${subtextClasses}`}>
              Please rate your overall satisfaction
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                    (step === 1 && selectedRating !== null) ||
                    (step === 2 && feedback.trim() !== '') ||
                    (step === 3 && name.trim() !== '' && email.trim() !== '')
                      ? 'bg-blue-500'
                      : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Emoji Rating Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-center space-x-3 sm:space-x-6 mb-4">
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
                    className={`p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 outline-none hover:outline-none focus:outline-none ${
                      isSelected || isHovered ? '' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    style={(isSelected || isHovered) ? { 
                      boxShadow: `0 0 0 3px ${item.ringColor}, 0 4px 12px rgba(0,0,0,0.1)`,
                      transform: (isSelected || isHovered) ? 'scale(1.1)' : 'scale(1)',
                      backgroundColor: (isSelected || isHovered) ? (isDarkMode ? item.bgColorDark : item.bgColor) : 'transparent'
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
                  className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full transition-colors duration-200"
                  style={{ 
                    color: emojis[selectedRating - 1]?.ringColor,
                    backgroundColor: isDarkMode ? emojis[selectedRating - 1]?.bgColorDark : emojis[selectedRating - 1]?.bgColor
                  }}
                >
                  {emojis[selectedRating - 1]?.label}
                </span>
              </div>
            )}
          </div>

          {/* Text Area Section */}
          {selectedRating && (
            <div className="mb-4 sm:mb-6 transition-all duration-500 ease-in-out">
              <label htmlFor="feedback" className={labelClasses}>
                Please share what worked well or what could be improved
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                onBlur={() => handleBlur('feedback')}
                className={textareaClasses(touched.feedback && !!errors.feedback)}
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

          {/* Contact Information Section */}
          {selectedRating && feedback.trim() && (
            <div className="mb-4 sm:mb-6 transition-all duration-500 ease-in-out">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClasses}>
                    Full Name / Company Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={inputClasses(touched.name && !!errors.name)}
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
                  <label htmlFor="email" className={labelClasses}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={inputClasses(touched.email && !!errors.email)}
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

          {/* Submit Button */}
          {selectedRating && feedback.trim() && name.trim() && email.trim() && (
            <div className="transition-all duration-500 ease-in-out">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !isFormValid}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 flex items-center justify-center text-sm sm:text-base ${
                  isFormValid && !isLoading
                    ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    : isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
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
              
              {/* Error message */}
              {submitError && (
                <div className={`mt-3 p-3 border rounded-lg transition-colors duration-200 ${
                  isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center text-red-700 dark:text-red-400 text-sm">
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
              <p className="text-xs sm:text-sm text-gray-500">
                👆 Please select a rating to continue
              </p>
            )}
            
            {selectedRating && !feedback.trim() && (
              <p className="text-xs sm:text-sm text-gray-500">
                ✏️ Please provide your feedback to continue
              </p>
            )}
            
            {selectedRating && feedback.trim() && (!name.trim() || !email.trim()) && (
              <p className="text-xs sm:text-sm text-gray-500">
                📝 Please fill in your contact information to submit
              </p>
            )}

            {selectedRating && feedback.trim() && name.trim() && email.trim() && !isFormValid && (
              <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 italic transition-colors duration-200">
                Please fix the validation errors above
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiRatingForm;