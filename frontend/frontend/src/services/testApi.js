import { API_BASE_URL } from "../config";

export const testApi = async () => {
  const res = await fetch(`${API_BASE_URL}/`);
  return res.json();
};
