import { useState, useEffect } from "react";
import { useProgram } from "./use-program";
import { FeeSettingsData } from "@/lib/program";

export function useFeeSettings() {
  const { program } = useProgram();
  const [feeSettings, setFeeSettings] = useState<FeeSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeeSettings = async () => {
      if (!program) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const settings = await program.getFeeSettings();
        setFeeSettings(settings);
      } catch (err) {
        console.error("Error fetching fee settings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch fee settings"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFeeSettings();
  }, [program]);

  // Helper function to convert basis points to percentage
  const getFeePercentage = () => {
    if (!feeSettings) return 0;
    return feeSettings.feePercentage / 100; // Convert basis points to percentage
  };

  // Helper function to calculate fee amount
  const calculateFee = (amount: number) => {
    if (!feeSettings) return 0;
    return (amount * feeSettings.feePercentage) / 10000; // Convert basis points to decimal
  };

  return {
    feeSettings,
    loading,
    error,
    getFeePercentage,
    calculateFee,
  };
}
