const serviceArea={south:44.06,north:44.40,west:28.43,east:28.80};
function isInsideServiceArea(lat,lng){const latitude=Number(lat);const longitude=Number(lng);return Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=serviceArea.south&&latitude<=serviceArea.north&&longitude>=serviceArea.west&&longitude<=serviceArea.east}
module.exports={serviceArea,isInsideServiceArea};
