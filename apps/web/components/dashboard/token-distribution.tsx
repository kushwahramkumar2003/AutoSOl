import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Token {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  color: string;
  percentage: number;
}

interface TokenDistributionProps {
  tokens: Token[];
  className?: string;
}

export default function TokenDistribution({
  tokens,
  className,
}: TokenDistributionProps) {
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

  return (
    <Card className={cn("bg-dark-200 border-white/10 text-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Token Distribution
        </CardTitle>
        <div className="text-sm font-medium">${totalValue.toFixed(2)}</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map((token) => (
            <div key={token.symbol} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: token.color }}
                  />
                  <span>
                    {token.name} ({token.symbol})
                  </span>
                </div>
                <span className="font-medium">${token.value.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${token.percentage}%`,
                    backgroundColor: token.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/70">
                <span>
                  {token.amount} {token.symbol}
                </span>
                <span>{token.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
