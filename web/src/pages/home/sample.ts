import { maskPlate, type VehicleProfile } from "@carmitra/shared"

export const CREATE_QR = "Get your QR"
export const CREATE_PATH = "/app/vehicles/new"

/** The made-up vehicle shown in the page's previews. MH 12 AB 1234 is the usual example plate. */
export const SAMPLE_PLATE = "MH12AB1234"

export const sampleVehicle: VehicleProfile = {
  cmtId: "CMT-7K2M-94",
  type: "car",
  model: "hatchback",
  colour: "Orange",
  plateMasked: maskPlate(SAMPLE_PLATE),
  noteForVisitors: "",
  contactMode: "chat",
  contact: null,
  createdAt: "",
  updatedAt: "",
}

/** The same vehicle when its owner chooses to show their number. */
export const sampleVehicleWithNumber: VehicleProfile = {
  ...sampleVehicle,
  contactMode: "number",
  contact: { name: "Owner", phone: "+919000000000" },
}
