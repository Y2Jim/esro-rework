---@diagnostic disable: undefined-global
ESRO = ESRO or {}

local function decodeJson(value, fallback)
    if type(value) ~= 'string' or value == '' then
        return fallback
    end

    local ok, decoded = pcall(json.decode, value)
    if not ok or decoded == nil then
        return fallback
    end

    return decoded
end

local function encodeJson(value)
    return json.encode(value or {})
end

ESRO.DB = {
    decodeJson = decodeJson,
    encodeJson = encodeJson
}

function ESRO.DB.FetchOne(query, parameters)
    return MySQL.single.await(query, parameters or {})
end

function ESRO.DB.FetchAll(query, parameters)
    return MySQL.query.await(query, parameters or {}) or {}
end

function ESRO.DB.Execute(query, parameters)
    return MySQL.query.await(query, parameters or {})
end

function ESRO.DB.Insert(query, parameters)
    return MySQL.insert.await(query, parameters or {})
end