const { getKeypairs } = require("./lib/dynamodbHelper");

exports.handler = async function (event) {
  try {
    const username = event.requestContext.authorizer.claims["cognito:username"];
    // keypairをdynamodbから取得する
    const res = await getKeypairs(username);
    console.log(res);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(res),
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};
