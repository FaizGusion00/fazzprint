import { apiService } from './api'

export interface OrdersTrendData {
  month: string
  orders: number
  monthShort: string
  year: string
}

export interface StatusDistributionData {
  status: string
  count: number
  value: number
}

export interface SpendingTrendData {
  month: string
  amount: number
  monthShort: string
  year: string
}

export interface CompletionRateData {
  month: string
  rate: number
  completed: number
  total: number
  monthShort: string
}

export interface ChartData {
  orders_trend: OrdersTrendData[]
  status_distribution: StatusDistributionData[]
  spending_trend: SpendingTrendData[]
  completion_rate: CompletionRateData[]
}

export const chartService = {
  // Get chart data for dashboard
  getChartData: async () => {
    return apiService.get<{ data: ChartData }>('/dashboard/charts')
  }
}

export default chartService 