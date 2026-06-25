import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import City from "../../models/City";
import State from "../../models/State";

export interface StateData {
  ibgeCode: number;
  uf: string;
  name: string;
  status?: string;
}

export interface CityData {
  ibgeCode: number;
  name: string;
  stateId: number;
  status?: string;
}

interface ListParams {
  searchParam?: string;
  status?: string;
  pageNumber?: string | number;
  rowsPerPage?: string | number;
  stateId?: string | number;
  uf?: string;
}

const paginationParams = (params: ListParams) => {
  const limit = Math.min(Math.max(Number(params.rowsPerPage) || 20, 1), 100);
  const page = Math.max(Number(params.pageNumber) || 1, 1);
  return { limit, offset: limit * (page - 1) };
};

const stateToRegister = (state: State): Record<string, unknown> => ({
  id: state.id,
  code: state.uf,
  name: state.name,
  description: `IBGE ${state.ibgeCode}`,
  status: state.status,
  data: {
    ibgeCode: state.ibgeCode,
    uf: state.uf
  },
  createdAt: state.createdAt,
  updatedAt: state.updatedAt
});

const cityToRegister = (city: City): Record<string, unknown> => ({
  id: city.id,
  code: String(city.ibgeCode),
  name: city.name,
  description: `${city.uf} - ${city.state?.name || ""}`.trim(),
  status: city.status,
  data: {
    ibgeCode: city.ibgeCode,
    stateId: city.stateId,
    stateIbgeCode: city.state?.ibgeCode,
    uf: city.uf
  },
  state: city.state
    ? {
        id: city.state.id,
        ibgeCode: city.state.ibgeCode,
        uf: city.state.uf,
        name: city.state.name
      }
    : null,
  createdAt: city.createdAt,
  updatedAt: city.updatedAt
});

export const listStates = async (
  params: ListParams,
  exportAll = false
): Promise<{
  count: number;
  hasMore: boolean;
  rows: Record<string, unknown>[];
}> => {
  const { limit, offset } = paginationParams(params);
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = {
    ...(params.status ? { status: params.status } : {})
  };

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { uf: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const { count, rows } = await State.findAndCountAll({
    where,
    order: [["name", "ASC"]],
    ...(exportAll ? {} : { limit, offset })
  });

  return {
    count,
    hasMore: exportAll ? false : count > offset + rows.length,
    rows: rows.map(stateToRegister)
  };
};

export const listCities = async (
  params: ListParams,
  exportAll = false
): Promise<{
  count: number;
  hasMore: boolean;
  rows: Record<string, unknown>[];
}> => {
  const { limit, offset } = paginationParams(params);
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.stateId ? { stateId: params.stateId } : {}),
    ...(params.uf ? { uf: String(params.uf).toUpperCase() } : {})
  };

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { uf: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const { count, rows } = await City.findAndCountAll({
    where,
    include: [{ model: State, attributes: ["id", "ibgeCode", "uf", "name"] }],
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    ...(exportAll ? {} : { limit, offset })
  });

  return {
    count,
    hasMore: exportAll ? false : count > offset + rows.length,
    rows: rows.map(cityToRegister)
  };
};

export const createState = async (data: StateData): Promise<State> =>
  State.create({
    ibgeCode: data.ibgeCode,
    uf: data.uf.toUpperCase(),
    name: data.name,
    status: data.status || "active"
  });

export const updateState = async (
  stateId: string | number,
  data: StateData
): Promise<State> => {
  const state = await State.findByPk(stateId);
  if (!state) throw new AppError("ERR_STATE_NOT_FOUND", 404);
  await state.update({
    ibgeCode: data.ibgeCode,
    uf: data.uf.toUpperCase(),
    name: data.name,
    status: data.status || "active"
  });
  return state;
};

export const deleteState = async (stateId: string | number): Promise<void> => {
  const state = await State.findByPk(stateId);
  if (!state) throw new AppError("ERR_STATE_NOT_FOUND", 404);
  const cities = await City.count({ where: { stateId } });
  if (cities > 0) throw new AppError("ERR_STATE_HAS_CITIES", 409);
  await state.destroy();
};

export const createCity = async (data: CityData): Promise<City> => {
  const state = await State.findByPk(data.stateId);
  if (!state) throw new AppError("ERR_STATE_NOT_FOUND", 404);
  return City.create({
    stateId: state.id,
    ibgeCode: data.ibgeCode,
    name: data.name,
    uf: state.uf,
    status: data.status || "active"
  });
};

export const updateCity = async (
  cityId: string | number,
  data: CityData
): Promise<City> => {
  const city = await City.findByPk(cityId);
  if (!city) throw new AppError("ERR_CITY_NOT_FOUND", 404);
  const state = await State.findByPk(data.stateId);
  if (!state) throw new AppError("ERR_STATE_NOT_FOUND", 404);
  await city.update({
    stateId: state.id,
    ibgeCode: data.ibgeCode,
    name: data.name,
    uf: state.uf,
    status: data.status || "active"
  });
  return city;
};

export const deleteCity = async (cityId: string | number): Promise<void> => {
  const city = await City.findByPk(cityId);
  if (!city) throw new AppError("ERR_CITY_NOT_FOUND", 404);
  await city.destroy();
};
