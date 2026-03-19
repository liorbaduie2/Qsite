"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface HebrewRegistrationProps {
  onComplete?: () => void;
}

export default function HebrewRegistration({
  onComplete,
}: HebrewRegistrationProps) {
  // --- State Management ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formStage, setFormStage] = useState<
    "FILLING" | "APPLICATION" | "CONFIRMED"
  >("FILLING");
  const [userId, setUserId] = useState<string>("");
  const [showBirthGenderModal, setShowBirthGenderModal] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    birthGender: "",
    username: "",
    password: "",
    confirmPassword: "",
    verificationCode: Array(6).fill(""),
    applicationText: "",
    fullName: "",
  });
  const [fieldStates, setFieldStates] = useState<{
    [key: string]: {
      isValid?: boolean;
      isInvalid?: boolean;
      isValidating?: boolean;
    };
  }>({});
  const [passwordVisible, setPasswordVisible] = useState({
    password: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalSteps = 6;
  const verificationInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // --- Helper & Hook Definitions ---

  // Auto-close modal after successful completion
  useEffect(() => {
    if (formStage === "CONFIRMED") {
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 4000); // Close after 4 seconds

      return () => clearTimeout(timer);
    }
  }, [formStage, onComplete]);

  // Debounced validation hook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const callbackRef = useRef(callback);
    useEffect(() => {
      callbackRef.current = callback;
    }, [callback]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useCallback(
      (...args: any[]) => {
        const handler = setTimeout(() => {
          callbackRef.current(...args);
        }, delay);
        return () => clearTimeout(handler);
      },
      [delay],
    );
  };

  // Age calculation function
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // --- API Calls ---

  const checkAvailability = useCallback(
    async (field: string, value: string, showLoader = true) => {
      try {
        if (showLoader) {
          setFieldStates((prev) => ({
            ...prev,
            [field]: { ...prev[field], isValidating: true },
          }));
        }
        const response = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field, value }),
        });
        const text = await response.text();
        let data: { available?: boolean; error?: string; message?: string };
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          setError(response.ok ? "שגיאה בבדיקת זמינות" : "שגיאת שרת - נסה שוב");
          setFieldStates((prev) => ({
            ...prev,
            [field]: { isValid: false, isInvalid: true, isValidating: false },
          }));
          return false;
        }
        if (!response.ok) {
          setError(data.error || "שגיאה בבדיקת זמינות");
          setFieldStates((prev) => ({
            ...prev,
            [field]: { isValid: false, isInvalid: true, isValidating: false },
          }));
          return false;
        }
        setFieldStates((prev) => ({
          ...prev,
          [field]: {
            isValid: data.available,
            isInvalid: !data.available,
            isValidating: false,
          },
        }));
        if (!data.available) {
          setError(data.message || "הערך כבר תפוס");
        }
        return data.available ?? false;
      } catch (error) {
        console.error("Check availability error:", error);
        setError("שגיאת רשת");
        setFieldStates((prev) => ({
          ...prev,
          [field]: { isValid: false, isInvalid: true, isValidating: false },
        }));
        return false;
      }
    },
    [],
  );

  const debouncedCheckAvailability = useDebounce(
    (field: string, value: string) => {
      checkAvailability(field, value, false);
    },
    800,
  );

  const sendVerification = async (phone: string) => {
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "שגיאה בשליחת קוד אימות";
        setError(msg);
        return false;
      }
      if (data.demoCode) {
        setSuccess(`קוד אימות לדמו: ${data.demoCode}`);
        setTimeout(() => setSuccess(""), 15000);
      } else {
        setSuccess(data.message || "קוד אימות נשלח");
        setTimeout(() => setSuccess(""), 5000);
      }
      return true;
    } catch (error) {
      console.error("Send verification error:", error);
      setError("שגיאת רשת");
      return false;
    }
  };

  const verifyPhone = async (phone: string, code: string) => {
    try {
      const response = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "שגיאה באימות טלפון");
        return false;
      }
      if (data.success && data.verificationToken) {
        setPhoneVerificationToken(data.verificationToken);
      }
      return data.success;
    } catch (error) {
      console.error("Verify phone error:", error);
      setError("שגיאת רשת");
      return false;
    }
  };

  const registerUser = async () => {
    try {
      console.log("Starting registration with data:", {
        phone: formData.phone,
        email: formData.email,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        birthGender: formData.birthGender,
        hasPassword: !!formData.password,
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName || "",
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          birthGender:
            formData.gender === "other" ? formData.birthGender : null,
          applicationText: "",
          phoneVerificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "שגיאה ברישום");
        return null;
      }

      if (data.success) {
        if (data.registrationToken) {
          setRegistrationToken(data.registrationToken);
        }
        setSuccess(data.message || "חשבון נוצר בהצלחה");
        setTimeout(() => setSuccess(""), 5000);
        return data.userId;
      }

      return null;
    } catch (error) {
      console.error("Register user error:", error);
      setError("שגיאת רשת - אנא נסה שוב");
      return null;
    }
  };

  const submitApplication = async (userId: string, applicationText: string) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/auth/submit-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          applicationText,
          registrationToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "הבקשה נשלחה בהצלחה!");
        setFormData((prev) => ({ ...prev, applicationText: "" }));
        setFormStage("CONFIRMED");
        return;
      }

      if (data.error_code === "INVALID_TEXT_LENGTH") {
        setError("טקסט הבקשה חייב להיות בין 10 ל-2000 תווים");
      } else if (data.error_code === "MISSING_FIELDS") {
        setError("יש למלא את כל השדות הנדרשים");
      } else {
        setError(data.error || "שגיאה בשליחת הבקשה");
      }
    } catch (error) {
      console.error("Application submission error:", error);
      setError("שגיאה בשליחת הבקשה. אנא נסה שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Validation Logic ---
  const phoneRegex = /^0(5[0-9]|7[7|6|8|9])(-?)([0-9]{3})(-?)([0-9]{4})$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  // Step 1: "המשך" only clickable after format is valid AND availability check passed (number not "כבר תפוס")
  const isPhoneFormatValid = phoneRegex.test(formData.phone.trim());
  const isPhoneCheckedAndAvailable = fieldStates.phone?.isValid === true;
  const isPhoneStepReady =
    currentStep !== 1 || (isPhoneFormatValid && isPhoneCheckedAndAvailable);

  // Step 3: email format valid AND availability check passed (not "כבר תפוס")
  const isEmailFormatValid = emailRegex.test(formData.email.trim());
  const isEmailCheckedAndAvailable = fieldStates.email?.isValid === true;
  const isEmailStepReady =
    currentStep !== 3 || (isEmailFormatValid && isEmailCheckedAndAvailable);

  // Step 4: username available, gender (and birthGender if other), DOB in [16, 120]
  const isUsernameValid =
    formData.username.length >= 3 &&
    formData.username.length <= 20 &&
    fieldStates.username?.isValid === true;
  const isGenderValid =
    !!formData.gender &&
    (formData.gender !== "other" || !!formData.birthGender);
  const dobAge = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : 0;
  const isDobValid = !!formData.dateOfBirth && dobAge >= 16 && dobAge <= 120;
  const isStep4Ready =
    currentStep !== 4 || (isUsernameValid && isGenderValid && isDobValid);

  // Step 5: password at least 8 characters
  const isStep5Ready = currentStep !== 5 || formData.password.length >= 8;

  const isCurrentStepReady =
    currentStep === 2 || currentStep === 6
      ? true
      : currentStep === 1
        ? isPhoneStepReady
        : currentStep === 3
          ? isEmailStepReady
          : currentStep === 4
            ? isStep4Ready
            : currentStep === 5
              ? isStep5Ready
              : true;

  const isContinueDisabled =
    isLoading ||
    (currentStep === 1 &&
      (!isPhoneFormatValid || !isPhoneCheckedAndAvailable)) ||
    (currentStep === 3 &&
      (!isEmailFormatValid || !isEmailCheckedAndAvailable)) ||
    (currentStep === 4 && !isStep4Ready) ||
    (currentStep === 5 && formData.password.length < 8);

  const validators = {
    1: async () => {
      if (!phoneRegex.test(formData.phone)) {
        setError("פורמט מספר טלפון לא חוקי (דוגמא: 0501234567)");
        setFieldStates((prev) => ({
          ...prev,
          phone: { isValid: false, isInvalid: true },
        }));
        return false;
      }
      const isAvailable = await checkAvailability("phone", formData.phone);
      if (!isAvailable) return false;
      const sent = await sendVerification(formData.phone);
      if (!sent) {
        return false;
      }
      return true;
    },
    2: async () => {
      const code = formData.verificationCode.join("");
      if (code.length !== 6) {
        setError("יש להזין קוד בן 6 ספרות");
        setFieldStates((prev) => ({
          ...prev,
          verificationCode: { isValid: false, isInvalid: true },
        }));
        return false;
      }
      const isValid = await verifyPhone(formData.phone, code);
      setFieldStates((prev) => ({
        ...prev,
        verificationCode: { isValid, isInvalid: !isValid },
      }));
      return isValid;
    },
    3: async () => {
      if (!emailRegex.test(formData.email)) {
        setError("פורמט אימייל לא חוקי");
        setFieldStates((prev) => ({
          ...prev,
          email: { isValid: false, isInvalid: true },
        }));
        return false;
      }
      return await checkAvailability("email", formData.email);
    },
    4: async () => {
      // Username validation
      if (formData.username.length < 3 || formData.username.length > 20) {
        setError("שם משתמש חייב להיות בין 3 ל-20 תווים");
        setFieldStates((prev) => ({
          ...prev,
          username: { isValid: false, isInvalid: true },
        }));
        return false;
      }

      const isUsernameAvailable = await checkAvailability(
        "username",
        formData.username,
      );
      if (!isUsernameAvailable) return false;

      // Gender validation
      if (!formData.gender) {
        setError("יש לבחור מגדר");
        setFieldStates((prev) => ({
          ...prev,
          gender: { isValid: false, isInvalid: true },
        }));
        return false;
      }

      if (formData.gender === "other" && !formData.birthGender) {
        setError('יש לציין מגדר לידה כאשר נבחר "אחר"');
        setFieldStates((prev) => ({
          ...prev,
          birthGender: { isValid: false, isInvalid: true },
        }));
        return false;
      }

      setFieldStates((prev) => ({
        ...prev,
        gender: { isValid: true, isInvalid: false },
      }));

      // DOB validation
      if (!formData.dateOfBirth) {
        setError("יש למלא תאריך לידה");
        setFieldStates((prev) => ({
          ...prev,
          dateOfBirth: { isValid: false, isInvalid: true },
        }));
        return false;
      }

      const age = calculateAge(formData.dateOfBirth);
      if (age < 16) {
        setError("גיל מינימום לרישום הוא 16 שנים");
        setFieldStates((prev) => ({
          ...prev,
          dateOfBirth: { isValid: false, isInvalid: true },
        }));
        return false;
      }
      if (age > 120) {
        setError("גיל מקסימלי לרישום הוא 120 שנים");
        setFieldStates((prev) => ({
          ...prev,
          dateOfBirth: { isValid: false, isInvalid: true },
        }));
        return false;
      }

      setFieldStates((prev) => ({
        ...prev,
        dateOfBirth: { isValid: true, isInvalid: false },
      }));

      return true;
    },
    5: () => {
      if (formData.password.length < 8) {
        setError("סיסמה חייבת להיות לפחות 8 תווים");
        setFieldStates((prev) => ({
          ...prev,
          password: { isValid: false, isInvalid: true },
        }));
        return false;
      }
      setFieldStates((prev) => ({
        ...prev,
        password: { isValid: true, isInvalid: false },
      }));
      return true;
    },
    6: async () => {
      if (formData.password !== formData.confirmPassword) {
        setError("הסיסמאות אינן זהות");
        setFieldStates((prev) => ({
          ...prev,
          confirmPassword: { isValid: false, isInvalid: true },
        }));
        return false;
      }
      if (formData.password.length < 8) {
        setError("סיסמה חייבת להיות לפחות 8 תווים");
        return false;
      }
      const newUserId = await registerUser();
      if (newUserId) {
        setUserId(newUserId);
        setFieldStates((prev) => ({
          ...prev,
          confirmPassword: { isValid: true, isInvalid: false },
        }));
        return true;
      }
      return false;
    },
  };

  // --- Event Handlers ---
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    if (fieldStates[field]?.isInvalid) {
      setFieldStates((prev) => ({ ...prev, [field]: {} }));
    }

    // Field-specific validation and debouncing
    if (field === "phone" && value.length > 0) {
      if (phoneRegex.test(value)) {
        debouncedCheckAvailability("phone", value);
      } else {
        setFieldStates((prev) => ({ ...prev, phone: {} }));
      }
    }
    if (field === "email" && value.length > 0) {
      if (emailRegex.test(value)) {
        debouncedCheckAvailability("email", value);
      } else {
        setFieldStates((prev) => ({ ...prev, email: {} }));
      }
    }
    if (field === "username" && value.length >= 3) {
      debouncedCheckAvailability("username", value);
    } else if (field === "username") {
      setFieldStates((prev) => ({ ...prev, username: {} }));
    }
    if (field === "dateOfBirth") {
      const age = value ? calculateAge(value) : 0;
      if (value && age >= 16 && age <= 120) {
        setFieldStates((prev) => ({
          ...prev,
          dateOfBirth: { isValid: true, isInvalid: false },
        }));
      } else if (value) {
        setFieldStates((prev) => ({
          ...prev,
          dateOfBirth: { isValid: false, isInvalid: true },
        }));
      } else {
        setFieldStates((prev) => ({ ...prev, dateOfBirth: {} }));
      }
    }
    if (field === "gender") {
      setFieldStates((prev) => ({
        ...prev,
        gender: { isValid: !!value, isInvalid: !value },
      }));
      // Show modal if "other" is selected
      if (value === "other") {
        setShowBirthGenderModal(true);
      } else {
        // Clear birthGender if gender is not 'other'
        setFormData((prev) => ({ ...prev, birthGender: "" }));
        setFieldStates((prev) => ({ ...prev, birthGender: {} }));
        setShowBirthGenderModal(false);
      }
    }
    if (field === "password") {
      const isValid = value.length >= 8;
      setFieldStates((prev) => ({
        ...prev,
        password: { isValid, isInvalid: !isValid },
      }));
    }
    if (field === "confirmPassword") {
      const isValid = value === formData.password && value.length > 0;
      setFieldStates((prev) => ({
        ...prev,
        confirmPassword: { isValid, isInvalid: !isValid },
      }));
    }
  };

  const handleBirthGenderSelect = (birthGender: string) => {
    setFormData((prev) => ({ ...prev, birthGender }));
    setFieldStates((prev) => ({
      ...prev,
      birthGender: { isValid: true, isInvalid: false },
    }));
    setShowBirthGenderModal(false);
    setError("");
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...formData.verificationCode];
    newCode[index] = value.slice(-1);
    setFormData((prev) => ({ ...prev, verificationCode: newCode }));
    if (value && index < 5) {
      verificationInputsRef.current[index + 1]?.focus();
    }
    setError("");
    setSuccess("");
  };

  const handleVerificationKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Backspace" &&
      !formData.verificationCode[index] &&
      index > 0
    ) {
      verificationInputsRef.current[index - 1]?.focus();
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const isValid =
        await validators[currentStep as keyof typeof validators]();
      if (isValid) {
        if (currentStep < totalSteps) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setFormStage("APPLICATION");
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
      setError("שגיאה בתהליך האימות");
    }
    setIsLoading(false);
  };

  const handleSubmitApplication = async () => {
    await submitApplication(userId, formData.applicationText);
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // --- Render Helpers ---
  const getFieldClassName = (field: string) => {
    const state = fieldStates[field];
    let className =
      "px-4 py-3 bg-white/60 dark:bg-gray-700/60 border-2 rounded-xl transition-colors text-right text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400";
    if (state?.isValidating)
      className += " border-blue-300 dark:border-blue-500";
    else if (state?.isInvalid) className += " border-red-500";
    else if (state?.isValid)
      className += " border-green-500 dark:border-green-600";
    else className += " border-gray-200 dark:border-gray-600";
    return className;
  };

  const getFieldIndicator = (field: string) => {
    const state = fieldStates[field];
    if (state?.isValidating)
      return <span className="text-blue-500 text-sm">בודק...</span>;
    return null;
  };

  const getVerificationClassName = () => {
    const state = fieldStates.verificationCode;
    let className =
      "w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-colors bg-slate-600 dark:bg-slate-700 text-white";
    if (state?.isInvalid) className += " border-red-500";
    else if (state?.isValid)
      className += " border-green-500 dark:border-green-600";
    else className += " border-gray-400 dark:border-gray-500";
    return className;
  };

  // Birth Gender Modal Component
  const BirthGenderModal = () =>
    showBirthGenderModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-fadeInUp border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              מגדר לידה
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              כאשר בחרת &quot;אחר&quot;, אנא ציין את המגדר שבו נולדת:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleBirthGenderSelect("male")}
                className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl hover:scale-105"
              >
                זכר
              </button>

              <button
                onClick={() => handleBirthGenderSelect("female")}
                className="w-full py-4 px-6 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl hover:scale-105"
              >
                נקבה
              </button>
            </div>

            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, gender: "" }));
                setShowBirthGenderModal(false);
              }}
              className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    );

  // --- RENDER LOGIC ---

  if (formStage === "APPLICATION" || formStage === "CONFIRMED") {
    return (
      <div className="text-center space-y-6 py-8">
        {formStage === "APPLICATION" ? (
          <div className="animate-fadeInUp space-y-6 text-right">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                בקשת הצטרפות לקהילה
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                ספר לנו מעט על עצמך ולמה אתה רוצה להצטרף
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  למה אתה רוצה להצטרף לקהילה? *
                </label>
                <textarea
                  value={formData.applicationText}
                  onChange={(e) =>
                    handleInputChange("applicationText", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 border-2 border-gray-200 dark:border-gray-600 rounded-xl transition-colors focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  rows={4}
                  placeholder="ספר לנו על עצמך, התחומים שמעניינים אותך, והניסיון שלך... (לפחות 10 תווים)"
                  maxLength={2000}
                />
                <div className="text-left text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formData.applicationText.length}/2000 תווים (מינימום: 10
                  תווים)
                </div>
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitApplication}
                disabled={isLoading || formData.applicationText.length < 10}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                  formData.applicationText.length >= 10
                    ? "button-gradient text-white hover:translate-y-[-2px]"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    שולח בקשה...
                  </div>
                ) : (
                  "שלח בקשת הצטרפות"
                )}
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                לאחר שליחת הבקשה, תקבל הודעה באימייל כאשר החשבון יאושר
              </p>
            </div>
          </div>
        ) : (
          // formStage === 'CONFIRMED'
          <div className="animate-fadeInUp">
            <h3 className="text-3xl font-bold text-green-500 dark:text-green-400 mb-4">
              👍 תודה רבה!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 mb-4">
              {success ||
                "הבקשה שלך התקבלה בהצלחה. הצוות שלנו יבחן אותה ויעדכן אותך במייל."}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              החלון יסגר אוטומטית בעוד מספר שניות...
            </p>
            <div className="mt-4">
              <button
                onClick={onComplete}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg transition-colors"
              >
                סגור עכשיו
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Birth Gender Modal */}
      <BirthGenderModal />

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-xl text-right">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded-xl text-right">
          {success}
        </div>
      )}

      <form className="space-y-2">
        {/* Step 1: Phone */}
        <fieldset
          className={`transition-all duration-300 ${currentStep !== 1 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="relative w-full" dir="ltr">
            {currentStep >= 3 && (
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center"
                aria-hidden
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            )}
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="מספר טלפון"
              className={
                getFieldClassName("phone") +
                " w-full pr-4" +
                (currentStep >= 3 ? " pl-10" : "")
              }
              disabled={currentStep !== 1}
              required
            />
          </div>
          <div className="text-right mt-1 h-4">
            {getFieldIndicator("phone")}
          </div>
        </fieldset>

        {/* Step 2: Verification */}
        {currentStep >= 2 && currentStep === 2 && (
          <fieldset className="transition-all duration-300">
            <div className="text-center animate-fadeInUp">
              <label className="block text-gray-800 dark:text-gray-100 text-lg font-bold mb-2">
                🔐 אימות קוד SMS
              </label>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                הזן את הקוד שנשלח למספר{" "}
                <b className="text-indigo-600 dark:text-indigo-400">
                  {formData.phone}
                </b>
              </p>
              <div className="flex justify-center gap-3 mb-2" dir="ltr">
                {formData.verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleVerificationCodeChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                    ref={(el) => {
                      verificationInputsRef.current[index] = el;
                    }}
                    className={getVerificationClassName()}
                    disabled={currentStep !== 2}
                  />
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 3: Email */}
        {currentStep >= 3 && (
          <fieldset
            className={`transition-all duration-300 ${currentStep !== 3 ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="כתובת דואר אלקטרוני"
              className={getFieldClassName("email") + " w-full"}
              disabled={currentStep !== 3}
              required
            />
            <div className="text-right mt-1 h-4">
              {getFieldIndicator("email")}
            </div>
          </fieldset>
        )}

        {/* Step 4: Username + Gender + DOB Combined (Right to Left Layout) */}
        {currentStep >= 4 && (
          <fieldset
            className={`transition-all duration-300 ${currentStep !== 4 ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="space-y-4">
              {/* Row container: Username → Gender → Date of Birth (Right to Left) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Username (Right) */}
                <div className="md:order-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                    שם משתמש
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    placeholder="שם משתמש (3-20 תווים)"
                    maxLength={20}
                    className={getFieldClassName("username") + " w-full"}
                    disabled={currentStep !== 4}
                    required
                  />
                  <div className="text-right mt-1 h-4">
                    {getFieldIndicator("username")}
                  </div>
                </div>

                {/* Gender (Center) */}
                <div className="md:order-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                    👤 מגדר
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    className={getFieldClassName("gender") + " w-full"}
                    disabled={currentStep !== 4}
                    required
                  >
                    <option value="">בחר מגדר</option>
                    <option value="male">זכר</option>
                    <option value="female">נקבה</option>
                    <option value="other">אחר</option>
                  </select>
                  <div className="text-right mt-1 h-4">
                    {formData.gender === "other" && formData.birthGender && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        מגדר לידה:{" "}
                        {formData.birthGender === "male" ? "זכר" : "נקבה"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date of Birth (Left) */}
                <div className="md:order-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                    תאריך לידה
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    className={getFieldClassName("dateOfBirth") + " w-full"}
                    disabled={currentStep !== 4}
                    min={
                      new Date(
                        new Date().getFullYear() - 120,
                        new Date().getMonth(),
                        new Date().getDate(),
                      )
                        .toISOString()
                        .split("T")[0]
                    }
                    max={
                      new Date(
                        new Date().getFullYear() - 16,
                        new Date().getMonth(),
                        new Date().getDate(),
                      )
                        .toISOString()
                        .split("T")[0]
                    }
                    required
                  />
                  <div className="text-right mt-1 h-4">
                    {formData.dateOfBirth &&
                      (() => {
                        const age = calculateAge(formData.dateOfBirth);
                        const validAge = age >= 16 && age <= 120;
                        return (
                          <span
                            className={`text-xs ${validAge ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            גיל: {age} שנים
                          </span>
                        );
                      })()}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 5: Password */}
        {currentStep >= 5 && (
          <fieldset
            className={`transition-all duration-300 ${currentStep !== 5 ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="relative">
              <input
                type={passwordVisible.password ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="סיסמה (לפחות 8 תווים)"
                className={getFieldClassName("password") + " w-full"}
                disabled={currentStep !== 5}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("password")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                disabled={currentStep !== 5}
              >
                {passwordVisible.password ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="mt-1 h-4" />
          </fieldset>
        )}

        {/* Step 6: Confirm Password */}
        {currentStep >= 6 && (
          <fieldset
            className={`transition-all duration-300 ${currentStep !== 6 ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="relative">
              <input
                type={passwordVisible.confirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="🔑 אימות סיסמה"
                className={getFieldClassName("confirmPassword") + " w-full"}
                disabled={currentStep !== 6}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                disabled={currentStep !== 6}
              >
                {passwordVisible.confirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="mt-1 h-4" />
          </fieldset>
        )}

        <div className="flex justify-center space-x-2 pt-3" dir="ltr">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i + 1 <= currentStep
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 shadow-lg"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={handleNext}
            disabled={isContinueDisabled}
            className={
              isCurrentStepReady
                ? "w-full bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
                : "w-full py-4 rounded-xl font-bold text-lg bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-all duration-300"
            }
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                מעבד...
              </div>
            ) : currentStep === totalSteps ? (
              "השלם רישום"
            ) : (
              "המשך"
            )}
          </button>
        </div>
      </form>

      <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        שלב {currentStep} מתוך {totalSteps}
      </div>

      <style jsx>{`
        input:focus,
        textarea:focus,
        select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
          outline: none;
        }
        input.border-red-500:focus,
        select.border-red-500:focus {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
        }
        input.border-green-500:focus,
        select.border-green-500:focus {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2) !important;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
