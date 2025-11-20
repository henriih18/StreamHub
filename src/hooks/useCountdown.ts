import { useState, useEffect, useCallback } from "react";

interface UseCountdownOptions {
  onExpire?: () => void;
  interval?: number;
}

export function useCountdown(
  targetDate: Date | string | null,
  options: UseCountdownOptions = {}
) {
  const { onExpire, interval = 1000 } = options;
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    if (!targetDate) {
      setTimeLeft(0);
      setIsExpired(false);
      return;
    }

    const target = new Date(targetDate);
    const now = new Date();
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      setTimeLeft(0);
      setIsExpired(true);

      if (!hasTriggered && onExpire) {
        setHasTriggered(true);
        onExpire();
      }
      return;
    }

    setTimeLeft(difference);
    setIsExpired(false);
  }, [targetDate, onExpire]);

  useEffect(() => {
    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, interval);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, interval]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
      minutes,
      seconds,
      formatted: `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`,
    };
  };

  return {
    timeLeft,
    isExpired,
    minutes: formatTime(timeLeft).minutes,
    seconds: formatTime(timeLeft).seconds,
    formatted: formatTime(timeLeft).formatted,
  };
}
