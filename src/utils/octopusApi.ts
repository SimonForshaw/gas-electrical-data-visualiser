// Octopus Energy API utility functions
// API Documentation: https://developer.octopus.energy/docs/api/
// Guide: https://www.guylipman.com/octopus/api_guide.html

const API_BASE_URL = "https://api.octopus.energy/v1";

export interface OctopusApiCredentials {
  apiKey: string;
  accountNumber: string;
}

export interface MeterPoint {
  mpan?: string; // Electricity meter point administration number
  mprn?: string; // Gas meter point reference number
  serialNumber: string;
  type: "electricity" | "gas";
  isExport?: boolean; // For export meters (solar, etc.)
  address?: string; // Property address for display
  isCurrent?: boolean; // Whether this is the current property
}

export interface AccountDetails {
  number: string; // API uses "number" not "accountNumber"
  properties: Array<{
    id: number;
    moved_in_at: string;
    moved_out_at: string | null;
    address_line_1: string;
    address_line_2: string;
    address_line_3: string;
    town: string;
    county: string;
    postcode: string;
    electricity_meter_points: Array<{
      mpan: string;
      profile_class: number;
      consumption_standard: number;
      meters: Array<{
        serial_number: string;
        registers: Array<{
          identifier: string;
          rate: string;
          is_settlement_register: boolean;
        }>;
      }>;
      agreements: Array<{
        tariff_code: string;
        valid_from: string;
        valid_to: string | null;
      }>;
    }>;
    gas_meter_points: Array<{
      mprn: string;
      consumption_standard: number;
      meters: Array<{
        serial_number: string;
      }>;
      agreements: Array<{
        tariff_code: string;
        valid_from: string;
        valid_to: string | null;
      }>;
    }>;
  }>;
}

export interface ConsumptionDataPoint {
  consumption: number;
  interval_start: string;
  interval_end: string;
}

export interface ConsumptionDataPointWithCost extends ConsumptionDataPoint {
  cost: number; // Cost in £ for this period
  rate: number; // Rate in £/kWh that was applied
  standingCharge: number; // Standing charge in £ for this period (pro-rated)
}

export interface ConsumptionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConsumptionDataPoint[];
}

/**
 * Test API connection by fetching account details
 */
export async function testApiConnection(
  credentials: OctopusApiCredentials
): Promise<{ success: boolean; message: string }> {
  try {
    await getAccountDetails(credentials);
    return {
      success: true,
      message: "Successfully connected to Octopus Energy API",
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Unknown error occurred" };
  }
}

/**
 * Fetch account details including meter points and tariff information
 * Endpoint: GET /v1/accounts/{account_number}/
 * Requires: Basic Auth with API key
 */
export async function getAccountDetails(
  credentials: OctopusApiCredentials
): Promise<AccountDetails> {
  const url = `${API_BASE_URL}/accounts/${credentials.accountNumber}/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API key or account number");
    } else if (response.status === 404) {
      throw new Error("Account not found");
    } else {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch electricity consumption data for a specific meter
 * Endpoint: GET /v1/electricity-meter-points/{mpan}/meters/{serial_number}/consumption/
 * Parameters:
 * - period_from: Start date in UTC format (YYYY-MM-DDTHH:MM:SSZ)
 * - period_to: End date in UTC format
 * - order_by: 'period' for chronological order (default is reverse)
 * - page_size: Number of results per page (max 25000, default 100)
 */
export async function getElectricityConsumption(
  credentials: OctopusApiCredentials,
  mpan: string,
  serialNumber: string,
  periodFrom?: string,
  periodTo?: string,
  pageSize: number = 25000
): Promise<ConsumptionDataPoint[]> {
  const params = new URLSearchParams({
    order_by: "period",
    page_size: pageSize.toString(),
  });

  if (periodFrom) {
    params.append("period_from", periodFrom);
  }
  if (periodTo) {
    params.append("period_to", periodTo);
  }

  const url = `${API_BASE_URL}/electricity-meter-points/${mpan}/meters/${serialNumber}/consumption/?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch electricity consumption: ${response.status} ${response.statusText}`
    );
  }

  const data: ConsumptionResponse = await response.json();

  // Handle pagination - fetch all pages if there's more data
  let allResults = [...data.results];
  let nextUrl = data.next;

  while (nextUrl) {
    const nextResponse = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
        "Content-Type": "application/json",
      },
    });

    if (!nextResponse.ok) {
      break; // Stop if there's an error
    }

    const nextData: ConsumptionResponse = await nextResponse.json();
    allResults = [...allResults, ...nextData.results];
    nextUrl = nextData.next;
  }

  return allResults;
}

/**
 * Fetch gas consumption data for a specific meter
 * Endpoint: GET /v1/gas-meter-points/{mprn}/meters/{serial_number}/consumption/
 * Note: Gas data may be in cubic meters (SMETS2) or kWh (SMETS1) depending on meter type
 */
export async function getGasConsumption(
  credentials: OctopusApiCredentials,
  mprn: string,
  serialNumber: string,
  periodFrom?: string,
  periodTo?: string,
  pageSize: number = 25000
): Promise<ConsumptionDataPoint[]> {
  const params = new URLSearchParams({
    order_by: "period",
    page_size: pageSize.toString(),
  });

  if (periodFrom) {
    params.append("period_from", periodFrom);
  }
  if (periodTo) {
    params.append("period_to", periodTo);
  }

  const url = `${API_BASE_URL}/gas-meter-points/${mprn}/meters/${serialNumber}/consumption/?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch gas consumption: ${response.status} ${response.statusText}`
    );
  }

  const data: ConsumptionResponse = await response.json();

  // Handle pagination
  let allResults = [...data.results];
  let nextUrl = data.next;

  while (nextUrl) {
    const nextResponse = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
        "Content-Type": "application/json",
      },
    });

    if (!nextResponse.ok) {
      break;
    }

    const nextData: ConsumptionResponse = await nextResponse.json();
    allResults = [...allResults, ...nextData.results];
    nextUrl = nextData.next;
  }

  return allResults;
}

/**
 * Extract meter points from account details
 */
export function extractMeterPoints(
  accountDetails: AccountDetails
): MeterPoint[] {
  const meterPoints: MeterPoint[] = [];

  accountDetails.properties.forEach((property) => {
    const isCurrent = property.moved_out_at === null;
    const address = `${property.address_line_1}, ${property.town}${
      isCurrent ? " (Current)" : " (Moved out)"
    }`;

    // Extract electricity meters (API uses snake_case: electricity_meter_points)
    property.electricity_meter_points.forEach((meterPoint) => {
      meterPoint.meters.forEach((meter) => {
        meterPoints.push({
          mpan: meterPoint.mpan,
          serialNumber: meter.serial_number,
          type: "electricity",
          isExport: false,
          address: address,
          isCurrent: isCurrent,
        });
      });
    });

    // Extract gas meters
    property.gas_meter_points.forEach((meterPoint) => {
      meterPoint.meters.forEach((meter) => {
        meterPoints.push({
          mprn: meterPoint.mprn,
          serialNumber: meter.serial_number,
          type: "gas",
          address: address,
          isCurrent: isCurrent,
        });
      });
    });
  });

  // Sort so current properties appear first
  return meterPoints.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return 0;
  });
}

/**
 * Convert API consumption data to the format used by the app
 * API returns half-hourly data with intervalStart and intervalEnd
 * We'll aggregate to daily totals to match CSV format
 */
export function convertConsumptionToAppFormat(
  consumptionData: ConsumptionDataPoint[]
): Array<{ date: string; value: number }> {
  // Group by date (YYYY-MM-DD) and sum consumption
  const dailyData: { [date: string]: number } = {};

  consumptionData.forEach((point) => {
    // Parse the interval start to get the date
    const date = new Date(point.interval_start);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = 0;
    }
    dailyData[dateKey] += point.consumption;
  });

  // Convert to array format
  return Object.entries(dailyData)
    .map(([date, value]) => ({
      date,
      value: parseFloat(value.toFixed(3)), // Round to 3 decimal places
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get half-hourly consumption data without aggregation
 * Useful for detailed time-of-use analysis
 */
export function convertConsumptionToHalfHourly(
  consumptionData: ConsumptionDataPoint[]
): Array<{ date: string; value: number }> {
  return consumptionData.map((point) => ({
    date: point.interval_start,
    value: parseFloat(point.consumption.toFixed(3)),
  }));
}

/**
 * Get consumption data for a date range
 * Automatically converts dates to UTC format required by API
 */
export async function getConsumptionForDateRange(
  credentials: OctopusApiCredentials,
  meterPoint: MeterPoint,
  startDate: Date,
  endDate: Date
): Promise<ConsumptionDataPoint[]> {
  // Convert dates to UTC format (YYYY-MM-DDTHH:MM:SSZ)
  const periodFrom = startDate.toISOString();
  const periodTo = endDate.toISOString();

  if (meterPoint.type === "electricity" && meterPoint.mpan) {
    return await getElectricityConsumption(
      credentials,
      meterPoint.mpan,
      meterPoint.serialNumber,
      periodFrom,
      periodTo
    );
  } else if (meterPoint.type === "gas" && meterPoint.mprn) {
    return await getGasConsumption(
      credentials,
      meterPoint.mprn,
      meterPoint.serialNumber,
      periodFrom,
      periodTo
    );
  } else {
    throw new Error("Invalid meter point configuration");
  }
}

/**
 * Get the date range of available data for a meter
 * Fetches earliest and latest consumption records
 */
export async function getAvailableDateRange(
  credentials: OctopusApiCredentials,
  meterPoint: MeterPoint
): Promise<{ earliest: string; latest: string }> {
  const baseUrl =
    meterPoint.type === "electricity"
      ? `${API_BASE_URL}/electricity-meter-points/${meterPoint.mpan}/meters/${meterPoint.serialNumber}/consumption/`
      : `${API_BASE_URL}/gas-meter-points/${meterPoint.mprn}/meters/${meterPoint.serialNumber}/consumption/`;

  // Fetch earliest record (oldest first, limit 1)
  // Use a date from before smart meters existed to ensure we get the absolute first record
  const earliestParams = new URLSearchParams({
    order_by: "period",
    page_size: "1",
    period_from: "2015-01-01T00:00:00Z", // Before most smart meters were installed
  });

  const earliestResponse = await fetch(`${baseUrl}?${earliestParams}`, {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
      "Content-Type": "application/json",
    },
  });

  if (!earliestResponse.ok) {
    throw new Error(
      `Failed to fetch earliest date: ${earliestResponse.status}`
    );
  }

  const earliestData: ConsumptionResponse = await earliestResponse.json();

  // Fetch latest record (newest first, limit 1) - API default is reverse order
  // No need for period_to - API defaults to returning most recent data
  const latestParams = new URLSearchParams({
    page_size: "1",
  });

  const latestResponse = await fetch(`${baseUrl}?${latestParams}`, {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${credentials.apiKey}:`),
      "Content-Type": "application/json",
    },
  });

  if (!latestResponse.ok) {
    throw new Error(`Failed to fetch latest date: ${latestResponse.status}`);
  }

  const latestData: ConsumptionResponse = await latestResponse.json();

  if (earliestData.results.length === 0 || latestData.results.length === 0) {
    throw new Error(
      "No consumption data available for this meter. This may be because the property has been moved out of, or the meter is no longer active."
    );
  }

  // Return dates in YYYY-MM-DD format for date inputs
  const earliest = earliestData.results[0].interval_start.split("T")[0];
  const latest = latestData.results[0].interval_start.split("T")[0];

  console.log(`Available date range for meter: ${earliest} to ${latest}`);

  return { earliest, latest };
}

/**
 * Fetch all tariff rates for a specific date range with the tariff code from account details
 * This gets the actual historical rates that were in effect during the consumption period
 */
export async function getHistoricalRatesForMeter(
  accountDetails: AccountDetails,
  meterPoint: MeterPoint,
  startDate: Date,
  endDate: Date
): Promise<TariffRate[]> {
  // Find the tariff code(s) that were active during this period
  const tariffCodes: string[] = [];

  accountDetails.properties.forEach((property) => {
    if (meterPoint.type === "electricity") {
      property.electricity_meter_points.forEach((mp) => {
        if (mp.mpan === meterPoint.mpan) {
          mp.agreements.forEach((agreement) => {
            const validFrom = new Date(agreement.valid_from);
            const validTo = agreement.valid_to
              ? new Date(agreement.valid_to)
              : new Date("2099-12-31");

            // Check if this agreement overlaps with our date range
            if (validFrom <= endDate && validTo >= startDate) {
              tariffCodes.push(agreement.tariff_code);
            }
          });
        }
      });
    } else if (meterPoint.type === "gas") {
      property.gas_meter_points.forEach((mp) => {
        if (mp.mprn === meterPoint.mprn) {
          mp.agreements.forEach((agreement) => {
            const validFrom = new Date(agreement.valid_from);
            const validTo = agreement.valid_to
              ? new Date(agreement.valid_to)
              : new Date("2099-12-31");

            if (validFrom <= endDate && validTo >= startDate) {
              tariffCodes.push(agreement.tariff_code);
            }
          });
        }
      });
    }
  });

  if (tariffCodes.length === 0) {
    console.warn("No tariff codes found for date range");
    return [];
  }

  // Fetch rates for all applicable tariff codes
  const allRates: TariffRate[] = [];

  for (const tariffCode of tariffCodes) {
    const rates = await getTariffRates(
      tariffCode,
      meterPoint.type,
      startDate.toISOString(),
      endDate.toISOString()
    );
    allRates.push(...rates);
  }

  // Sort by valid_from date
  allRates.sort(
    (a, b) =>
      new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
  );

  return allRates;
}

/**
 * Calculate costs for consumption data using historical tariff rates
 * This matches each consumption period with the correct rate that was active at that time
 */
export async function calculateCostsWithHistoricalRates(
  accountDetails: AccountDetails,
  meterPoint: MeterPoint,
  consumptionData: ConsumptionDataPoint[],
  startDate: Date,
  endDate: Date
): Promise<ConsumptionDataPointWithCost[]> {
  // Fetch historical rates for the period
  const rates = await getHistoricalRatesForMeter(
    accountDetails,
    meterPoint,
    startDate,
    endDate
  );

  if (rates.length === 0) {
    console.warn("No rates available, costs will be zero");
    return consumptionData.map((point) => ({
      ...point,
      cost: 0,
      rate: 0,
      standingCharge: 0,
    }));
  }

  // Fetch standing charges for the period
  const tariffCodes: string[] = [];
  accountDetails.properties.forEach((property) => {
    const meterPoints =
      meterPoint.type === "electricity"
        ? property.electricity_meter_points
        : property.gas_meter_points;

    meterPoints.forEach((mp: any) => {
      if (
        (meterPoint.mpan && mp.mpan === meterPoint.mpan) ||
        (meterPoint.mprn && mp.mprn === meterPoint.mprn)
      ) {
        mp.agreements.forEach((agreement: any) => {
          if (!tariffCodes.includes(agreement.tariff_code)) {
            tariffCodes.push(agreement.tariff_code);
          }
        });
      }
    });
  });

  // Get standing charge (using first tariff for simplicity - could be enhanced)
  let standingChargePerDay = 0;
  if (tariffCodes.length > 0) {
    standingChargePerDay = await getStandingCharges(
      tariffCodes[0],
      meterPoint.type,
      startDate.toISOString(),
      endDate.toISOString()
    );
  }

  // Calculate standing charge per half-hour period (1/48th of daily charge)
  // API returns standing charge in pence, convert to pounds
  const standingChargePer30Min = standingChargePerDay / 100 / 48;

  // Match each consumption point with its rate
  const dataWithCosts: ConsumptionDataPointWithCost[] = consumptionData.map(
    (point) => {
      const pointTime = new Date(point.interval_start);

      // Find the rate that was valid for this time period
      const applicableRate = rates.find((rate) => {
        const rateValidFrom = new Date(rate.valid_from);
        const rateValidTo = rate.valid_to
          ? new Date(rate.valid_to)
          : new Date("2099-12-31");
        return pointTime >= rateValidFrom && pointTime < rateValidTo;
      });

      const rateValue = applicableRate ? applicableRate.value_inc_vat : 0;
      // API returns rates in pence, convert to pounds for cost calculation
      const cost = point.consumption * (rateValue / 100);

      return {
        ...point,
        cost: cost,
        rate: rateValue,
        standingCharge: standingChargePer30Min,
      };
    }
  );

  return dataWithCosts;
}

/**
 * Get tariff rates for a specific tariff code
 * Endpoint: GET /v1/products/{product_code}/electricity-tariffs/{tariff_code}/standard-unit-rates/
 * or GET /v1/products/{product_code}/gas-tariffs/{tariff_code}/standard-unit-rates/
 */
export interface TariffRate {
  value_exc_vat: number;
  value_inc_vat: number;
  valid_from: string;
  valid_to: string | null;
  payment_method: string | null;
}

export interface TariffRatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TariffRate[];
}

export interface StandingChargeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    value_exc_vat: number;
    value_inc_vat: number;
    valid_from: string;
    valid_to: string | null;
    payment_method: string | null;
  }>;
}

export async function getTariffRates(
  tariffCode: string,
  energyType: "electricity" | "gas",
  periodFrom?: string,
  periodTo?: string
): Promise<TariffRate[]> {
  // Extract product code from tariff code (e.g., "E-1R-AGILE-FLEX-22-11-25-C" -> "AGILE-FLEX-22-11-25")
  const parts = tariffCode.split("-");
  const productCode = parts.slice(2, -1).join("-");

  const params = new URLSearchParams({
    page_size: "1500",
  });

  if (periodFrom) {
    params.append("period_from", periodFrom);
  }
  if (periodTo) {
    params.append("period_to", periodTo);
  }

  const tariffType =
    energyType === "electricity" ? "electricity-tariffs" : "gas-tariffs";
  const url = `${API_BASE_URL}/products/${productCode}/${tariffType}/${tariffCode}/standard-unit-rates/?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.warn(`Failed to fetch tariff rates: ${response.status}`);
    return [];
  }

  const data: TariffRatesResponse = await response.json();
  return data.results;
}

export async function getStandingCharges(
  tariffCode: string,
  energyType: "electricity" | "gas",
  periodFrom?: string,
  periodTo?: string
): Promise<number> {
  const parts = tariffCode.split("-");
  const productCode = parts.slice(2, -1).join("-");

  const params = new URLSearchParams({
    page_size: "100",
  });

  if (periodFrom) {
    params.append("period_from", periodFrom);
  }
  if (periodTo) {
    params.append("period_to", periodTo);
  }

  const tariffType =
    energyType === "electricity" ? "electricity-tariffs" : "gas-tariffs";
  const url = `${API_BASE_URL}/products/${productCode}/${tariffType}/${tariffCode}/standing-charges/?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.warn(`Failed to fetch standing charges: ${response.status}`);
    return 0;
  }

  const data: StandingChargeResponse = await response.json();

  // Return the most recent standing charge
  if (data.results.length > 0) {
    return data.results[0].value_inc_vat;
  }

  return 0;
}

/**
 * Get current tariff information for a meter including rates
 */
export async function getCurrentTariffInfo(
  accountDetails: AccountDetails,
  meterPoint: MeterPoint
): Promise<{
  standardRate: number;
  nightRate: number | null;
  standingCharge: number;
  tariffCode: string;
} | null> {
  try {
    // Find the current agreement for this meter
    type Agreement = {
      tariff_code: string;
      valid_from: string;
      valid_to: string | null;
    };

    let currentAgreement: Agreement | null = null;

    accountDetails.properties.forEach((property) => {
      if (meterPoint.type === "electricity") {
        property.electricity_meter_points.forEach((mp) => {
          if (mp.mpan === meterPoint.mpan) {
            // Find the most recent agreement that's currently active
            const now = new Date().toISOString();
            const activeAgreements = mp.agreements.filter(
              (a) =>
                a.valid_from <= now && (a.valid_to === null || a.valid_to > now)
            );
            if (activeAgreements.length > 0) {
              currentAgreement = activeAgreements[0] as Agreement;
            }
          }
        });
      } else if (meterPoint.type === "gas") {
        property.gas_meter_points.forEach((mp) => {
          if (mp.mprn === meterPoint.mprn) {
            const now = new Date().toISOString();
            const activeAgreements = mp.agreements.filter(
              (a) =>
                a.valid_from <= now && (a.valid_to === null || a.valid_to > now)
            );
            if (activeAgreements.length > 0) {
              currentAgreement = activeAgreements[0] as Agreement;
            }
          }
        });
      }
    });

    if (!currentAgreement) {
      console.warn("No active tariff agreement found");
      return null;
    }

    // TypeScript needs help understanding currentAgreement is not null here
    const agreement: Agreement = currentAgreement;

    // Fetch just the most recent rates (last 2 days to ensure we get recent data)
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const rates = await getTariffRates(
      agreement.tariff_code,
      meterPoint.type,
      twoDaysAgo.toISOString(),
      now.toISOString()
    );

    const standingCharge = await getStandingCharges(
      agreement.tariff_code,
      meterPoint.type,
      twoDaysAgo.toISOString(),
      now.toISOString()
    );

    if (rates.length === 0) {
      console.warn("No rates found for tariff");
      return null;
    }

    console.log(`Fetched ${rates.length} rates for display`);
    console.log(
      "Sample rates:",
      rates
        .slice(0, 5)
        .map((r) => ({ value: r.value_inc_vat, from: r.valid_from }))
    );
    console.log("Standing charge:", standingCharge);

    // For Economy 7 / time-of-use tariffs, detect night rate vs standard rate
    let standardRate = 0;
    let nightRate: number | null = null;

    // Group rates by hour to detect time-of-use patterns
    const ratesByHour: { [hour: string]: number[] } = {};
    rates.forEach((rate) => {
      const hour = new Date(rate.valid_from).getHours();
      const hourKey = hour.toString();
      if (!ratesByHour[hourKey]) {
        ratesByHour[hourKey] = [];
      }
      ratesByHour[hourKey].push(rate.value_inc_vat);
    });

    console.log("Rates by hour:", ratesByHour);

    // Night hours for Economy 7: 00:30-05:30 (hours 0-5)
    const nightHours = ["0", "1", "2", "3", "4"];
    const nightRateValues = nightHours
      .filter((h) => ratesByHour[h] && ratesByHour[h].length > 0)
      .flatMap((h) => ratesByHour[h]);

    const dayRateValues = Object.keys(ratesByHour)
      .filter((h) => !nightHours.includes(h) && ratesByHour[h].length > 0)
      .flatMap((h) => ratesByHour[h]);

    console.log("Night rate values:", nightRateValues);
    console.log("Day rate values:", dayRateValues);

    if (nightRateValues.length > 0 && dayRateValues.length > 0) {
      // Calculate minimum night rate and median day rate
      const minNightRate = Math.min(...nightRateValues);
      const medianDayRate =
        dayRateValues.reduce((sum, r) => sum + r, 0) / dayRateValues.length;

      console.log(
        "Min night rate:",
        minNightRate,
        "Median day rate:",
        medianDayRate
      );

      // If night rate is at least 20% cheaper, it's a time-of-use tariff
      if (minNightRate < medianDayRate * 0.8) {
        nightRate = minNightRate;
        standardRate = medianDayRate;
      } else {
        // Not a significant difference - treat as single rate
        const allRatesAvg =
          rates.reduce((sum, r) => sum + r.value_inc_vat, 0) / rates.length;
        standardRate = allRatesAvg;
      }
    } else {
      // Single rate tariff - use average of all rates
      const allRatesAvg =
        rates.reduce((sum, r) => sum + r.value_inc_vat, 0) / rates.length;
      standardRate = allRatesAvg;
    }

    console.log("Calculated rates:", {
      standardRate,
      nightRate,
      standingCharge,
      standardRateInPence: standardRate * 100,
      nightRateInPence: nightRate ? nightRate * 100 : null,
      standingChargeInPence: standingCharge * 100,
    });

    return {
      standardRate,
      nightRate,
      standingCharge,
      tariffCode: agreement.tariff_code,
    };
  } catch (error) {
    console.error("Error fetching tariff info:", error);
    return null;
  }
}
