import axios from "axios";

export async function createMachine() {
  return axios.post("/machine");
}

export async function getMachineId(id) {
  return axios.get("/machine/" + id);
}
