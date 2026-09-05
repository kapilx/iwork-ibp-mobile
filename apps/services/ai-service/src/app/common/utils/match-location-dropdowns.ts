import fuzzball from "fuzzball";
import axios from "axios";

export interface MatchResult {
  label: string;
  value: string;
  raw?: any;
}

const COUNTRY_API = process.env.URL_ORG_SERVICE + "/address/country/list";
const STATE_API = (countryId: string) =>
  process.env.URL_ORG_SERVICE + `/address/state/${countryId}`;
const CITY_API = (search: string) =>
  process.env.URL_ORG_SERVICE + `/master/city?page=1&limit=20&search=${search}&searchBy=name`;
const COUNTRY_SCORE = 60;
const STATE_SCORE = 60;
const CITY_SCORE = 50;

export async function matchLocationDropdowns(
  loc: { country: string; state: string; city: string, addressType?: string },
  request: any
): Promise<{
  country: MatchResult | null;
  state: MatchResult | null;
  city: MatchResult | null;
}> {
  // Fetch country list
  let countryObj = null;
  if (loc?.country && loc?.country != "") {
    let countryRes = await axios.get(COUNTRY_API, {
       headers: {
        Authorization: request.headers.authorization ?? "",
        userid: request.headers.userid ? parseInt(request.headers.userid, 10) : ""
      },
    });
    let countries = countryRes.data?.data || [];
    let countryNames = countries.map((country: any) => country.name);

    // Fuzzy match country
    if (loc?.country && countryNames.length > 0) {
      const countryMatch = fuzzball.extract(loc.country, countryNames, {
        scorer: fuzzball.ratio,
        returnObjects: true,
        limit: 1,
      });
      if (countryMatch?.length && countryMatch[0].score > COUNTRY_SCORE) {
        countryObj =
          countries.find((c: any) => c.name === countryMatch[0].choice) || null;
      }
    }
  }

  // Fuzzy match state
  let stateObj = null;
  if (loc?.state && loc?.state != "" && countryObj) {
    let states: any[] = [];
    if (countryObj && countryObj.id) {
      const stateRes = await axios.get(STATE_API(countryObj.id), {
        headers: {
        Authorization: request.headers.authorization ?? "",
        userid: request.headers.userid ? parseInt(request.headers.userid, 10) : ""
      },
      });
      states = stateRes.data?.data || [];
      let stateNames = states.map((s: any) => s.name);
      if (loc?.state && stateNames.length > 0) {
        const stateMatch = fuzzball.extract(loc.state, stateNames, {
          scorer: fuzzball.ratio,
          returnObjects: true,
          limit: 1,
        });
        if (stateMatch?.length && stateMatch[0].score > STATE_SCORE) {
          stateObj =
            states.find((s: any) => s.name === stateMatch[0].choice) || null;
        }
      }
    }
  }
  // Fetch city list
  let cityObj = null;
  if (loc?.city && loc?.city != "") {
    let cities: any[] = [];
    const citySearch =
      typeof loc?.city === "string" ? loc.city.substring(0, 3) : "";
    const cityRes = await axios.get(CITY_API(encodeURIComponent(citySearch)), {
      headers: {
        Authorization: request.headers.authorization ?? "",
        userid: request.headers.userid ? parseInt(request.headers.userid, 10) : ""
      },
    });
    cities = cityRes.data?.data?.data || [];
    const cityNames = cities.map((ct: any) => ct.name);
    // Fuzzy match city
    if (loc?.city && cityNames.length > 0) {
      const cityMatch = fuzzball.extract(loc.city, cityNames, {
        scorer: fuzzball.ratio,
        returnObjects: true,
        limit: 1,
      });
      if (cityMatch?.length && cityMatch[0].score > CITY_SCORE) {
        cityObj =
          cities.find((ct: any) => ct.name === cityMatch[0].choice) || null;
      }
    }
  }
  const result = {
    country: countryObj
      ? { value: countryObj.id, label: countryObj.name }
      : null,
    state: stateObj ? { value: stateObj.id, label: stateObj.name } : null,
    city: cityObj ? { value: cityObj.id, label: cityObj.name } : null,
  };
  return result;
}
