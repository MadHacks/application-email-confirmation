const AWS = require('aws-sdk');
const SES = new AWS.SES();

exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    
    var to_email = "";
    var first_name = "";
    var last_name = "";
    
    // iterate over body.data.fields and get the values for the fields we want
    for (var i = 0; i < body.data.fields.length; i++) {

        if (body.data.fields[i].key == "question_7R91WA") {
            to_email = body.data.fields[i].value;
        }

        if (body.data.fields[i].key == "question_ja95yE") {
            first_name = body.data.fields[i].value;
        }

        if (body.data.fields[i].key == "question_2Ex1eV") {
            last_name = body.data.fields[i].value;
        }
    }

    if (to_email == "" || first_name == "" || last_name == "") {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Missing required fields" }),
        };
    }


    const subject = "Confirmation Of Application To MadHacks Fall 2023"
    const body_text = "Hello " + first_name + ",\n\nThank you for applying to MadHacks Fall 2023! We will be reviewing your application and will get back to you soon.\n\nBest,\nMadHacks Team"

    const params = {
        Source: process.env.FROM_EMAIL,
        Destination: {
            ToAddresses: [to_email]
        },
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Text: {
                    Data: body_text
                }
            }
        }
    };

    try {
        await SES.sendEmail(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent!' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
