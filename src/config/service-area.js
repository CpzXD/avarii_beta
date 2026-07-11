const serviceArea={south:44.10,north:44.34,west:28.50,east:28.75};
function isInsideServiceArea(lat,lng){const latitude=Number(lat);const longitude=Number(lng);return Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=serviceArea.south&&latitude<=serviceArea.north&&longitude>=serviceArea.west&&longitude<=serviceArea.east}
module.exports={serviceArea,isInsideServiceArea};
