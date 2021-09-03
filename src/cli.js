import arg from 'arg';
import inquirer from 'inquirer';
import fs from 'fs';
import csvtojson from 'csvtojson';
import _ from 'lodash';

async function promptForMissingOptions(options) {
  const questions = [];
  if (!options.input) {
    questions.push({
      type: 'filePath',
      name: 'input',
      message: 'Please locate the CSV file'
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    csvPath: options.input || answers.input
  };
}

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--input': String,
      '-i': '--input'
    },
    {
      argv: rawArgs.slice(2)
    }
  );
  return {
    input: args['--input'] || false
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  const { csvPath } = await promptForMissingOptions(options);
  if (csvPath.includes('.csv')) {
    let finalJSON = [];
    await csvtojson({ output: 'line', noheader: true })
      .fromFile(csvPath)
      .then((jsonObj) => {
        const newObj = jsonObj
          .map((item) => item.split(','))
          .reduce((acc, cur) => {
            if (cur[0] == '*') {
              acc.push([]);
            } else {
              acc[acc.length - 1].push(cur);
            }
            return acc;
          }, [])
          .map((item) => {
            if (item[0]) {
              const sizeCharts = [];
              const bust = [];
              const hip = [];
              const waist = [];
              let bustNdx = false,
                waistNdx = false,
                hipNdx = false;
              if (item[1][0] == 'Size') {
                for (let i = 2; i < item.length; i++) {
                  if (item[i][0] == 'Chest') {
                    bustNdx = true;
                  } else if (item[i][0] == 'Waist') {
                    waistNdx = true;
                  } else if (item[i][0] == 'Hip') {
                    hipNdx = true;
                  } else {
                    if (hipNdx) {
                      item[i].splice(0, 1);
                      hip.push(
                        _.zipObject(
                          [
                            'size',
                            'tooTight',
                            'snugFit',
                            'looseFit',
                            'tooLoose',
                            'median'
                          ],
                          item[i].map((item, i) =>
                            i > 0 ? (item == '' ? 0 : parseInt(item)) : item
                          )
                        )
                      );
                    } else if (waistNdx) {
                      item[i].splice(0, 1);
                      waist.push(
                        _.zipObject(
                          [
                            'size',
                            'tooTight',
                            'snugFit',
                            'looseFit',
                            'tooLoose',
                            'median'
                          ],
                          item[i].map((item, i) =>
                            i > 0 ? (item == '' ? 0 : parseInt(item)) : item
                          )
                        )
                      );
                    } else if (bustNdx) {
                      item[i].splice(0, 1);
                      bust.push(
                        _.zipObject(
                          [
                            'size',
                            'tooTight',
                            'snugFit',
                            'looseFit',
                            'tooLoose',
                            'median'
                          ],
                          item[i].map((item, i) =>
                            i > 0 ? (item == '' ? 0 : parseInt(item)) : item
                          )
                        )
                      );
                    } else {
                      sizeCharts.push(
                        _.zipObject(
                          [
                            'size',
                            'bust',
                            'bustUpper',
                            'waist',
                            'waistUpper',
                            'hip',
                            'hipUpper'
                          ],
                          item[i].map((item, i) =>
                            i > 0 ? (item == '' ? 0 : parseInt(item)) : item
                          )
                        )
                      );
                    }
                  }
                }
              }

              const brandSizeCharts = {
                region: '',
                subType: '',
                sizeCharts: sizeCharts,
                adjustmentTable: {
                  bust: bust,
                  waist: waist,
                  hip: hip
                }
              };
              const brandConfig = {
                name: item[0][0],
                gender: '',
                brandSizeCharts: [brandSizeCharts],
                id: new Date().getTime().toString()
              };
              finalJSON.push(brandConfig);
            }
          });
      });

    fs.writeFileSync(
      csvPath.replace('.csv', '.json'),
      JSON.stringify(finalJSON)
    );
  } else {
    console.error(new Error('The input file must be a csv'));
  }

  // console.log(options);
}
