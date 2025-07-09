# Dashboard Migration Guide: Blockchain to Backend

This guide explains how to migrate the dashboard from fetching data directly from the blockchain to using a backend API with a database.

## Current Architecture

The dashboard currently fetches data directly from the Solana blockchain using:

1. **DashboardService** (`lib/dashboard-service.ts`) - Handles data fetching and calculations
2. **useDashboardData Hook** (`hooks/use-dashboard-data.ts`) - React hook for state management
3. **Dashboard Page** (`app/dashboard/page.tsx`) - UI components

## Migration Strategy

### Phase 1: Create Backend API (Current)

1. **Database Schema**: Design tables for payment schedules, transactions, and analytics
2. **API Routes**: Create REST endpoints for dashboard data
3. **Data Sync**: Implement blockchain event listeners to sync data to database

### Phase 2: Gradual Migration

1. **Feature Flag**: Add toggle to switch between blockchain and API data
2. **Parallel Implementation**: Run both systems simultaneously
3. **Data Validation**: Compare results between blockchain and database

### Phase 3: Full Migration

1. **Remove Blockchain Dependencies**: Update components to use only API
2. **Performance Optimization**: Add caching, pagination, and real-time updates
3. **Enhanced Analytics**: Add more sophisticated analytics and reporting

## Database Schema Example

```sql
-- Payment Schedules
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY,
  schedule_address VARCHAR(44) UNIQUE NOT NULL,
  owner_address VARCHAR(44) NOT NULL,
  recipient_address VARCHAR(44) NOT NULL,
  total_amount DECIMAL(20, 9) NOT NULL,
  remaining_amount DECIMAL(20, 9) NOT NULL,
  payment_amount DECIMAL(20, 9) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'ACTIVE', 'COMPLETED', 'CANCELLED'
  memo TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES payment_schedules(id),
  scheduled_time TIMESTAMP NOT NULL,
  executed BOOLEAN DEFAULT FALSE,
  execution_time TIMESTAMP,
  tx_signature VARCHAR(88),
  amount DECIMAL(20, 9) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Transactions (for analytics)
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  from_address VARCHAR(44) NOT NULL,
  to_address VARCHAR(44) NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  token_symbol VARCHAR(10) NOT NULL,
  tx_signature VARCHAR(88) UNIQUE,
  status VARCHAR(20) NOT NULL, -- 'COMPLETED', 'PENDING', 'FAILED'
  executed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Analytics Cache
CREATE TABLE dashboard_analytics (
  id UUID PRIMARY KEY,
  user_address VARCHAR(44) NOT NULL,
  period VARCHAR(10) NOT NULL, -- 'daily', 'weekly', 'monthly'
  stats JSONB NOT NULL,
  payment_activity JSONB NOT NULL,
  token_distribution JSONB NOT NULL,
  cached_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```

## API Endpoints

### Dashboard Data

```typescript
GET /api/dashboard/:address
Response: {
  stats: DashboardStats,
  paymentActivity: PaymentActivity,
  recentTransactions: Transaction[],
  upcomingPayments: UpcomingPayment[],
  tokenDistribution: TokenDistribution[]
}
```

### Payment Schedules

```typescript
GET /api/schedules?owner=:address&status=:status
POST /api/schedules
PUT /api/schedules/:id
DELETE /api/schedules/:id
```

### Analytics

```typescript
GET /api/analytics/:address?period=:period
GET /api/analytics/transactions/:address?limit=:limit
```

## Migration Steps

### 1. Update DashboardService

```typescript
// lib/dashboard-service.ts
export class DashboardService {
  private apiBaseUrl: string;
  private useApi: boolean;

  constructor(program?: AutoSolProgram, useApi: boolean = false) {
    this.program = program;
    this.useApi = useApi;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
  }

  async fetchDashboardData(userAddress: PublicKey): Promise<DashboardData> {
    if (this.useApi) {
      return this.fetchFromAPI(userAddress.toString());
    } else {
      return this.fetchFromBlockchain(userAddress);
    }
  }

  private async fetchFromAPI(address: string): Promise<DashboardData> {
    const response = await fetch(`${this.apiBaseUrl}/dashboard/${address}`);
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data from API");
    }
    return response.json();
  }

  private async fetchFromBlockchain(
    address: PublicKey
  ): Promise<DashboardData> {
    // Existing blockchain logic
  }
}
```

### 2. Update Hook

```typescript
// hooks/use-dashboard-data.ts
export function useDashboardData(
  useApi: boolean = false
): DashboardDataWithState {
  const { program } = useProgram();
  const { publicKey } = useWallet();

  // ... existing logic

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!publicKey) {
        setData((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const dashboardService = new DashboardService(program, useApi);
        const dashboardData =
          await dashboardService.fetchDashboardData(publicKey);

        setData({
          ...dashboardData,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch dashboard data",
        }));
      }
    };

    fetchDashboardData();
  }, [program, publicKey, useApi]);

  return data;
}
```

### 3. Add Feature Flag

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_API_DASHBOARD: process.env.NEXT_PUBLIC_USE_API_DASHBOARD === "true",
  // Add more feature flags as needed
};
```

### 4. Update Dashboard Page

```typescript
// app/dashboard/page.tsx
import { FEATURE_FLAGS } from "@/lib/feature-flags";

export default function DashboardPage() {
  const data = useDashboardData(FEATURE_FLAGS.USE_API_DASHBOARD);

  // ... rest of the component
}
```

## Data Synchronization

### Blockchain Event Listeners

```typescript
// lib/blockchain-sync.ts
export class BlockchainSync {
  private program: AutoSolProgram;
  private apiClient: ApiClient;

  constructor(program: AutoSolProgram, apiClient: ApiClient) {
    this.program = program;
    this.apiClient = apiClient;
  }

  async syncScheduleCreated(scheduleAddress: string) {
    const schedule = await this.program.getPaymentSchedule(
      new PublicKey(scheduleAddress)
    );
    await this.apiClient.createSchedule(schedule);
  }

  async syncPaymentExecuted(scheduleAddress: string, paymentIndex: number) {
    const schedule = await this.program.getPaymentSchedule(
      new PublicKey(scheduleAddress)
    );
    const payment = schedule.payments[paymentIndex];
    await this.apiClient.updatePayment(scheduleAddress, paymentIndex, payment);
  }

  async syncScheduleCancelled(scheduleAddress: string) {
    await this.apiClient.cancelSchedule(scheduleAddress);
  }
}
```

## Performance Optimizations

### 1. Caching Strategy

```typescript
// lib/cache.ts
export class DashboardCache {
  private redis: Redis;

  async getCachedData(key: string): Promise<DashboardData | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedData(
    key: string,
    data: DashboardData,
    ttl: number = 300
  ): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  async invalidateUserData(address: string): Promise<void> {
    const pattern = `dashboard:${address}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 2. Real-time Updates

```typescript
// lib/realtime.ts
export class RealtimeDashboard {
  private socket: WebSocket;

  subscribeToUpdates(address: string, callback: (data: DashboardData) => void) {
    this.socket = new WebSocket(`ws://localhost:3001/dashboard/${address}`);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
  }

  unsubscribe() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
```

## Testing Strategy

### 1. Data Validation

```typescript
// tests/dashboard-validation.ts
describe("Dashboard Data Validation", () => {
  it("should return consistent data between blockchain and API", async () => {
    const blockchainData = await fetchFromBlockchain(address);
    const apiData = await fetchFromAPI(address);

    expect(blockchainData.stats.totalBalance).toBe(apiData.stats.totalBalance);
    expect(blockchainData.recentTransactions.length).toBe(
      apiData.recentTransactions.length
    );
  });
});
```

### 2. Performance Testing

```typescript
// tests/performance.ts
describe("Dashboard Performance", () => {
  it("should load API data faster than blockchain data", async () => {
    const blockchainStart = Date.now();
    await fetchFromBlockchain(address);
    const blockchainTime = Date.now() - blockchainStart;

    const apiStart = Date.now();
    await fetchFromAPI(address);
    const apiTime = Date.now() - apiStart;

    expect(apiTime).toBeLessThan(blockchainTime);
  });
});
```

## Deployment Checklist

- [ ] Set up database with proper indexes
- [ ] Implement blockchain event listeners
- [ ] Create API endpoints with authentication
- [ ] Add caching layer (Redis)
- [ ] Set up monitoring and logging
- [ ] Add feature flags for gradual rollout
- [ ] Test data consistency between blockchain and API
- [ ] Monitor performance metrics
- [ ] Plan rollback strategy

## Benefits of Migration

1. **Performance**: Faster data access with caching
2. **Scalability**: Handle more users without blockchain RPC limits
3. **Analytics**: More sophisticated analytics and reporting
4. **Reliability**: Reduced dependency on blockchain RPC nodes
5. **Cost**: Lower costs for data access
6. **Features**: Easier to add new features like notifications, alerts, etc.

## Rollback Plan

If issues arise during migration:

1. **Immediate**: Toggle feature flag back to blockchain
2. **Investigation**: Analyze data inconsistencies
3. **Fix**: Address issues in API or data sync
4. **Retry**: Gradually re-enable API usage
5. **Monitor**: Watch for any remaining issues

This migration strategy ensures a smooth transition from blockchain to backend while maintaining data integrity and user experience.
