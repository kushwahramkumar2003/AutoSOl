"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/use-program";
import RecipientDetailsStep from "@/components/dashboard/payments/steps/recipient-details";
import PaymentDetailsStep from "@/components/dashboard/payments/steps/payment-details";
import ScheduleStep from "@/components/dashboard/payments/steps/schedule-step";
import ReviewStep from "@/components/dashboard/payments/steps/review-step";
import SuccessStep from "@/components/dashboard/payments/steps/success-step";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";

// Define the form data structure based on the Solana contract
export interface PaymentScheduleFormData {
  recipient: {
    address: string;
    name: string;
  };
  payment: {
    amount: number;
    token: string;
    memo: string;
    symbol: string;
  };
  schedule: {
    scheduleTimes: number[]; // Unix timestamps
    selectedDates: Date[];
    frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
    endDate?: Date;
    repeatCount?: number;
  };
}

const steps = [
  { id: "recipient", title: "Recipient" },
  { id: "payment", title: "Payment Details" },
  { id: "schedule", title: "Schedule" },
  { id: "review", title: "Review" },
];

export default function NewPaymentForm() {
  const router = useRouter();
  const { program } = useProgram();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [scheduleAddress, setScheduleAddress] = useState<string | null>(null);
  const wallet = useWallet();

  const [formData, setFormData] = useState<PaymentScheduleFormData>({
    recipient: {
      address: "",
      name: "",
    },
    payment: {
      amount: 0,
      token: "So11111111111111111111111111111111111111112", // Default to SOL
      memo: "",
      symbol: "SOL",
    },
    schedule: {
      scheduleTimes: [],
      selectedDates: [],
      frequency: "once",
      repeatCount: 12,
    },
  });

  const [isFormValid, setIsFormValid] = useState(false);

  // Validate current step
  useEffect(() => {
    validateCurrentStep();
  }, [currentStep, formData]);

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Recipient
        setIsFormValid(
          !!formData.recipient.address && !!formData.recipient.name
        );
        break;
      case 1: // Payment Details
        setIsFormValid(formData.payment.amount > 0 && !!formData.payment.token);
        break;
      case 2: // Schedule
        setIsFormValid(formData.schedule.selectedDates.length > 0);
        break;
      case 3: // Review
        setIsFormValid(true);
        break;
      default:
        setIsFormValid(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!program || !wallet.publicKey) {
      setError("Program not initialized. Please connect your wallet.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert recipient address string to PublicKey
      let recipientPublicKey: PublicKey;
      try {
        recipientPublicKey = new PublicKey(formData.recipient.address);
      } catch (e) {
        throw new Error("Invalid recipient address", { cause: e });
      }

      // Get mint address based on selected token
      const mintAddress = new PublicKey(formData.payment.token);

      // Calculate amount in smallest units based on token decimals
      // For SOL: 1 SOL = 10^9 lamports
      // For other tokens, we would need to get the decimals from the token metadata
      const multiplier =
        formData.payment.symbol === "SOL" ? 1_000_000_000 : 1_000_000;
      const amount = Math.floor(formData.payment.amount * multiplier);

      console.log("Creating payment schedule with:", {
        amount,
        recipient: recipientPublicKey.toString(),
        scheduleTimes: formData.schedule.scheduleTimes,
        memo: formData.payment.memo,
        mintAddress: mintAddress.toString(),
      });

      // Create payment schedule on the blockchain
      const result = await program.createPaymentSchedule({
        paymentAmount: amount,
        recipientAddress: recipientPublicKey,
        scheduleTimes: formData.schedule.scheduleTimes,
        memo: formData.payment.memo,
      });

      setTxSignature(result.txSignature);
      setScheduleAddress(result.scheduleAddress.toString());

      // Show success toast
      toast.success(
        `Your payment schedule has been successfully created on the blockchain.`
      );

      // Go to success step
      goToNextStep();
    } catch (err) {
      console.error("Error creating payment schedule:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create payment schedule"
      );

      toast.error(`Failed to create payment schedule: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (
    stepId: string,
    data: Partial<PaymentScheduleFormData>
  ) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <RecipientDetailsStep
            data={formData.recipient}
            updateData={(data) =>
              updateFormData("recipient", { recipient: data })
            }
          />
        );
      case 1:
        return (
          <PaymentDetailsStep
            data={formData.payment}
            updateData={(data) => updateFormData("payment", { payment: data })}
          />
        );
      case 2:
        return (
          <ScheduleStep
            data={formData.schedule}
            updateData={(data) =>
              updateFormData("schedule", { schedule: data })
            }
          />
        );
      case 3:
        return <ReviewStep data={formData} />;
      case 4:
        return (
          <SuccessStep
            data={formData}
            txSignature={txSignature}
            scheduleAddress={scheduleAddress}
            onDone={() => router.push("/dashboard/payments")}
          />
        );
      default:
        return null;
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  if (!program) {
    return (
      <Alert className="bg-dark-200 border-white/10">
        <AlertCircle className="h-5 w-5 text-[#6E56CF]" />
        <AlertTitle>Program not initialized</AlertTitle>
        <AlertDescription>
          Please connect your wallet to create a payment schedule.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {currentStep < steps.length && (
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                    index < currentStep
                      ? "bg-[#10B981] text-white"
                      : index === currentStep
                        ? "bg-[#6E56CF] text-white"
                        : "bg-dark-200 text-white/50 border border-white/10"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    index === currentStep ? "text-white" : "text-white/50"
                  )}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-full mt-5 hidden md:block",
                      index < currentStep ? "bg-[#10B981]" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-dark-200 border-white/10 text-white overflow-hidden">
        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {currentStep < steps.length && (
          <div className="p-6 border-t border-white/10 flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0 || isSubmitting}
              className="border-white/10 bg-dark-300 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={goToNextStep}
                disabled={!isFormValid || isSubmitting}
                className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse mr-2">Creating...</span>
                    <Wallet className="h-4 w-4 animate-pulse" />
                  </>
                ) : (
                  <>
                    Create Payment Schedule
                    <Wallet className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
