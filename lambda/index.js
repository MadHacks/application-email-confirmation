const AWS = require("aws-sdk");
const SES = new AWS.SES();

exports.handler = async (event) => {
  // handle the RSVP confirmation emails
  const body = JSON.parse(event.body);
  var to_email = "";
  var first_name = "";

  var is_rsvp = false;
  var is_rsvp_yes = false;

  // iterate over body.data.fields and get the values for the fields we want
  for (var i = 0; i < body.data.fields.length; i++) {
    if (
      body.data.fields[i].key == "question_7R91WA" ||
      body.data.fields[i].key == "question_gDJEBP"
    ) {
      to_email = body.data.fields[i].value;
    }

    if (
      body.data.fields[i].key == "question_ja95yE" ||
      body.data.fields[i].key == "question_aQARbb"
    ) {
      first_name = body.data.fields[i].value;
    }

    if (body.data.fields[i].key == "question_7RaQlR") {
      is_rsvp = true;
      is_rsvp_yes =
        body.data.fields[i].value[0] == "3b086c77-00f6-4cf9-87d1-346df95b19f1";
    }
  }

  var subject = "";
  var body_text = "";
  if (is_rsvp) {
    subject = "MadHacks RSVP Confirmation"; // is_rsvp_yes
    if (is_rsvp_yes) {
        body_text = "Hello " + first_name + "," + "\n\nWe're excited to see you at MadHacks Fall 2023! Please join our Discord server for more information https://discord.gg/VgrNq2XgMe .\n\nBest,\nMadHacks Team";
    } else {
        body_text = "Hello " + first_name + "," + "\n\nWe're sorry to hear that you can't make it to MadHacks Fall 2023. We hope to see you at our next event!\n\nBest,\nMadHacks Team"
    }
  } else {
    // confirmation email
    subject = "Confirmation Of Application To MadHacks Fall 2023";
    body_text =
      "Hello " +
      first_name +
      ",\n\nThank you for applying to MadHacks Fall 2023! We will be reviewing your application and will get back to you soon.\n\nBest,\nMadHacks Team";
  }

  if (to_email == "" || first_name == "") {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [to_email],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Text: {
          Data: body_text,
        },
      },
    },
  };

  try {
    await SES.sendEmail(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
