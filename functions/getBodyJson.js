module.exports.getBodyJson = (event) => {
    try {
        const body = JSON.parse(event.body);
  
        return body;
        
    } catch (error) {
        return {error : "Bad formated JSON"}
    }
}