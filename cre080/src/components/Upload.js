import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Button, Typography, Container, Box, Stack, Grid } from "@mui/material";
import ExcelService from "../service/ExcelService";

function Upload() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploaderr, setuploaderr] = useState(false);
  const [reddata, setreddata] = useState(null);
  const [filename, setfilename] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [existingdata, setexistingdata] = useState(null);
  const [tennor, settennor] = useState(null);
  const [duplicateBaseHLFileNumbers, setDuplicateBaseHLFileNumbers] = useState(
    []
  );

  const fileInputRef = useRef(null);

  useEffect(() => {
    ExcelService.getminmaxtenor().then((res) => {
      settennor(res[0]);
    });
  }, []);

  useEffect(() => {
    if (jsonData !== null && !uploaderr) {
      handleUpload();
    }
    if (uploaderr) {
      const invalidRows = validateExcelData(jsonData);
      highlightInvalidCells(invalidRows);
    }
  }, [jsonData, uploaderr]);

  useEffect(() => {
    ExcelService.getAllFiles().then((res) => {
      setexistingdata(res);
    });
  }, [uploadedFile, filename]);

  const handleFileChange = (event) => {
    setSuccessMessage(null);
    const selectedFile = event.target.files[0];
    setfilename(selectedFile?.name);
    setUploadedFile(selectedFile);
    setDuplicateBaseHLFileNumbers([]);

    if (!selectedFile) {
      setErrorMessage("Please select a file.");
      return;
    }

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (fileExtension !== "xlsx") {
      setErrorMessage("Only .xlsx files are allowed.");
      return;
    }

    setErrorMessage(null);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const excelData1 = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        const startRow = 0;
        let endRow = 0;

        for (let i = excelData1.length - 1; i >= 0; i--) {
          const rowData = excelData1[i];
          const isRowEmpty = rowData.every((cellValue) => cellValue === "");
          if (!isRowEmpty) {
            endRow = i + 1;
            break;
          }
        }

        const excelData = excelData1.slice(startRow, endRow);

        if (excelData.length <= 1) {
          setErrorMessage("Excel sheet is empty or has no data.");
          setJsonData(null);
        } else {
          const questionData = transformExcelData(excelData);

          setErrorMessage(null);
          setJsonData(questionData);
          const uniqueBaseHLFileNumbers = new Set();
          excelData.slice(1).forEach((row) => {
            const baseHLFileNumber = row[0];
            if (uniqueBaseHLFileNumbers.has(baseHLFileNumber)) {
              setDuplicateBaseHLFileNumbers((prevDuplicates) => [
                ...prevDuplicates,
                baseHLFileNumber,
              ]);
            } else {
              uniqueBaseHLFileNumbers.add(baseHLFileNumber);
            }
          });
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };
  const transformExcelData = (excelData) => {
    const headers = excelData[0];
    const headerKeys = [
      "Base HL File Number",
      "Loan amount Max",
      "Tenor Min",
      "Tenor Max",
      "Net ROI",
      "Net Income",
      "Obligation",
      "Fees Percentage",
      "Fees Amount",
    ];

    const questionData = [];

    excelData.slice(1).forEach((row) => {
      const rowData = {};
      headerKeys.forEach((header, index) => {
        if (header === "base_HL_File_Number") {
          rowData[header] = row[index] ? row[index].toString() : null;
        } else if (header === "loan_amount_Max") {
          rowData[header] = row[index] ? row[index].toString() : null;
        } else {
          rowData[header] = row[index];
        }
      });

      questionData.push(rowData);
    });

    return questionData;
  };

  const handleUpload = () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!jsonData || jsonData.length <= 0) {
      setErrorMessage("Excel sheet is empty or has no data.");
    } else {
      const invalidRows = validateExcelData(jsonData);
      if (invalidRows.length > 0) {
        highlightInvalidCells(invalidRows);
      } else {
        const uniqueBaseHLFileNumbers = new Set();
        jsonData.slice(1).forEach((row) => {
          const baseHLFileNumber = row["Base HL File Number"];
          if (uniqueBaseHLFileNumbers.has(baseHLFileNumber)) {
            setDuplicateBaseHLFileNumbers((prevDuplicates) => [
              ...prevDuplicates,
              baseHLFileNumber,
            ]);
          } else {
            uniqueBaseHLFileNumbers.add(baseHLFileNumber);
          }
        });
        const newdata = [...jsonData];

        newdata.map((i) => {
          delete Object.assign(i, {
            ["base_HL_File_Number"]: i["Base HL File Number"],
          })["Base HL File Number"];
          delete Object.assign(i, {
            ["loan_amount_Max"]: i["Loan amount Max"],
          })["Loan amount Max"];
          delete Object.assign(i, {
            ["tenor_Min"]: i["Tenor Min"],
          })["Tenor Min"];
          delete Object.assign(i, {
            ["tenor_Max"]: i["Tenor Max"],
          })["Tenor Max"];
          delete Object.assign(i, {
            ["net_ROI"]: i["Net ROI"],
          })["Net ROI"];
          delete Object.assign(i, {
            ["net_Income"]: i["Net Income"],
          })["Net Income"];
          delete Object.assign(i, {
            ["obligation"]: i["Obligation"],
          })["Obligation"];
          delete Object.assign(i, {
            ["fees_Percentage"]: i["Fees Percentage"],
          })["Fees Percentage"];
          delete Object.assign(i, {
            ["fees_Amount"]: i["Fees Amount"],
          })["Fees Amount"];
        });

        ExcelService.postExcel(newdata)
          .then((res) => {
            newdata.map((i) => {
              delete Object.assign(i, {
                ["Base HL File Number"]: i["base_HL_File_Number"],
              })["base_HL_File_Number"];
              delete Object.assign(i, {
                ["Loan amount Max"]: i["loan_amount_Max"],
              })["loan_amount_Max"];
              delete Object.assign(i, {
                ["Tenor Min"]: i["tenor_Min"],
              })["tenor_Min"];
              delete Object.assign(i, {
                ["Tenor Max"]: i["tenor_Max"],
              })["tenor_Max"];
              delete Object.assign(i, {
                ["Net ROI"]: i["net_ROI"],
              })["net_ROI"];
              delete Object.assign(i, {
                ["Net Income"]: i["net_Income"],
              })["net_Income"];
              delete Object.assign(i, {
                ["Obligation"]: i["obligation"],
              })["obligation"];
              delete Object.assign(i, {
                ["Fees Percentage"]: i["fees_Percentage"],
              })["fees_Percentage"];
              delete Object.assign(i, {
                ["Fees Amount"]: i["fees_Amount"],
              })["fees_Amount"];
            });
            if (res.length === 0) {
              setUploadedFile(null);
              setfilename(null);
              setJsonData(null);
              setErrorMessage(null);
              setSuccessMessage("Uploaded successfully!");

              fileInputRef.current.value = "";
            } else if (res.length > 0) {
              setuploaderr(true);
              setSuccessMessage(null);

              setreddata(res);
            }
          })
          .catch((e) => setErrorMessage(e.response.data.message));
      }
    }
  };

  const validateExcelData = (data) => {
    const invalidRows = [];
    data.forEach((row, rowIndex) => {
      const baseHLFileNumber = uploaderr
        ? row["Base HL File Number"]
        : row["Base HL File Number"];
      const loanamount = row["Loan amount Max"];
      const tenormin = row["Tenor Min"];
      const tenormax = row["Tenor Max"];
      const netroi = row["Net ROI"];
      const netincome = row["Net Income"];
      const feesamount = row["Fees Amount"];
      const obligation = row["Obligation"];
      const feespercentage = row["Fees Percentage"];

      if (uploaderr) {
        if (reddata?.includes(baseHLFileNumber)) {
          invalidRows.push(rowIndex + 2);
        }
      } else {
        if (!/^[a-zA-Z0-9]+$/.test(baseHLFileNumber)) {
          invalidRows.push(rowIndex + 2);
        }

        if (!/^[0-9]+$/.test(loanamount) || parseInt(loanamount) === 0) {
          invalidRows.push(rowIndex + 2);
        }

        if (
          !/^[0-9]+$/.test(tenormin) ||
          parseInt(tenormin) === 0 ||
          parseInt(tenormin) * 12 < tennor?.MINIMUM_TERM
        ) {
          invalidRows.push(rowIndex + 2);
        }

        if (
          !/^[0-9]+$/.test(tenormax) ||
          parseInt(tenormax) === 0 ||
          parseInt(tenormax) * 12 > tennor?.MAXIMUM_TERM
        ) {
          invalidRows.push(rowIndex + 2);
        } else if (parseInt(tenormax) < parseInt(tenormin)) {
          invalidRows.push(rowIndex + 2);
        }

        if (!/^[0-9]+(\.[0-9]+)?$/.test(netroi) || parseInt(netroi) === 0) {
          invalidRows.push(rowIndex + 2);
        }

        if (!/^[0-9]+$/.test(netincome) || parseInt(netincome) === 0) {
          invalidRows.push(rowIndex + 2);
        }

        if (obligation !== "" && !/^[0-9]+$/.test(obligation)) {
          invalidRows.push(rowIndex + 2);
        }
        if (
          (feesamount !== "" && feespercentage !== "") ||
          (feesamount === "" && feespercentage === "")
        ) {
          invalidRows.push(rowIndex + 2);
        } else if (feesamount !== "" && !/^[0-9]+$/.test(feesamount)) {
          invalidRows.push(rowIndex + 2);
        } else if (
          feespercentage !== "" &&
          (!/^[0-9]+$/.test(feespercentage) || parseInt(feespercentage) === 0)
        ) {
          invalidRows.push(rowIndex + 2);
        }

        if (existingdata.includes(baseHLFileNumber)) {
          invalidRows.push(rowIndex + 2);
        }
      }
    });

    return invalidRows;
  };

  const highlightInvalidCells = (invalidRows) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const redFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0000" },
    };

    const yellowFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" },
    };

    const boldHeaderStyle = {
      font: { bold: true },
    };

    const headers = Object.keys(jsonData[0]);

    headers.push("errors");
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.fill = yellowFill;
      cell.font = boldHeaderStyle.font;
    });

    const errorMessages = [];

    jsonData.forEach((row, rowIndex) => {
      const baseHLFileNumber = row["Base HL File Number"];
      const worksheetRow = worksheet.addRow(Object.values(row));
      if (invalidRows.includes(rowIndex + 2)) {
        const errors = [];
        headers.forEach((header, index) => {
          const cellValue = row[header];
          if (header === "Base HL File Number") {
            if (duplicateBaseHLFileNumbers.includes(baseHLFileNumber)) {
              // worksheetRow.getCell(
              //   headers.indexOf("Base HL File Number") + 1
              // ).fill = redFill;
              // errors.push(`  ${header}: Duplicate value`);
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(`  ${header}: DUPLICATE VALUE`);
            }
          }
          if (
            header === "Base HL File Number" &&
            reddata?.includes(cellValue)
          ) {
            worksheetRow.getCell(index + 1).fill = redFill;
            errors.push(`  ${header}: INVALID DATA`);
          }
          if (
            header === "Loan amount Max" ||
            header === "Tenor Min" ||
            header === "Tenor Max" ||
            header === "Net Income"
          ) {
            if (invalidRows.includes(rowIndex + 2)) {
              if (!/^[0-9]+$/.test(cellValue)) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: should be in number only`);
              } else if (parseInt(cellValue) === 0) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: Should not be zero`);
              }
            }
          }
          if (header === "Tenor Min") {
            console.log(parseInt(cellValue));
            if (parseInt(cellValue) * 12 < tennor?.MINIMUM_TERM) {
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(`  ${header}: Should not less than Minimum Term`);
            }
          }
          if (header === "Obligation") {
            if (cellValue !== "" && !/^[0-9]+$/.test(cellValue)) {
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(`  ${header}: should be in number only`);
            }
          }

          if (header === "Fees Amount") {
            if (invalidRows.includes(rowIndex + 2)) {
              if (cellValue === "") {
                worksheetRow.getCell(index + 1).value = null; // You can set it to null or any other appropriate value
              } else if (!/^[0-9]+$/.test(cellValue)) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: should be in number only`);
              } else if (parseInt(cellValue) === 0) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: Should not be zero`);
              }
            }
          }

          if (header === "Fees Amount" && cellValue !== "") {
            if (row["Fees Percentage"] !== "") {
              worksheetRow.getCell(
                headers.indexOf("Fees Percentage") + 1
              ).fill = redFill;
              errors.push(
                "Fees Percentage should be empty when Fees Amount has a value"
              );
            }
          } else if (header === "Fees Percentage" && cellValue !== "") {
            if (row["Fees Amount"] !== "") {
              worksheetRow.getCell(headers.indexOf("Fees Amount") + 1).fill =
                redFill;
              errors.push(
                "Fees Amount should be empty when Fees Percentage has a value"
              );
            }
          }

          if (header === "Net ROI") {
            if (invalidRows.includes(rowIndex + 2)) {
              if (!/^[0-9]+(\.[0-9]+)?$/.test(cellValue)) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: should be in number `);
              }
            }
          }
          // const baseHLFileNumbers = [];
          // if (
          //   header === "Base HL File Number" &&
          //   baseHLFileNumbers.includes(cellValue)
          // ) {
          //   worksheetRow.getCell(index + 1).fill = redFill;
          //   errors.push(`  ${header}: Duplicate Base HL File Number`);
          // }
          if (header === "Base HL File Number") {
            if (invalidRows.includes(rowIndex + 2)) {
              if (!/^[a-zA-Z0-9]+$/.test(cellValue)) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: Invalid Cell`);
              } else if (existingdata.includes(cellValue)) {
                worksheetRow.getCell(index + 1).fill = redFill;
                errors.push(`  ${header}: Data Is Already Present`);
              }
            }
          }

          if (header === "Tenor Max") {
            if (parseInt(cellValue) * 12 > tennor?.MAXIMUM_TERM) {
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(`  ${header}: SHould not Greater than Maximum Term`);
            }
            if (parseInt(cellValue) < parseInt(row["Tenor Min"])) {
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(`  ${header}: Should not be less than Tenor Min`);
            }
          }
          if (header === "Fees Percentage") {
            if (cellValue === "") {
              worksheetRow.getCell(index + 1).value = null; // You can set it to null or any other appropriate value
            } else if (!/^[0-9]+(\.[0-9]+)?$/.test(cellValue)) {
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(
                `  ${header}: should not have characters and special characters`
              );
            } else if (parseInt(cellValue) === 0) {
              worksheetRow.getCell(index + 1).fill = redFill;
              errors.push(`  ${header}: Should not be zero`);
            } else {
              const feesPercentage = parseFloat(cellValue);
              const roundedFeesPercentage = parseFloat(
                feesPercentage.toFixed(2)
              );

              worksheetRow.getCell(index + 1).value = roundedFeesPercentage;
            }
          }

          if (
            header === "Fees Amount" &&
            row["Fees Percentage"] === "" &&
            cellValue === ""
          ) {
            worksheetRow.getCell(index + 1).fill = redFill;
            errors.push("Fees Amount or Fees Percentage should have a value");
          }

          if (
            header === "Fees Percentage" &&
            row["Fees Amount"] === "" &&
            cellValue === ""
          ) {
            worksheetRow.getCell(index + 1).fill = redFill;
            errors.push("Fees Amount or Fees Percentage should have a value");
          }
        });

        worksheetRow.getCell(headers.length).value = errors.join("\n");
        errorMessages.push(...errors);
      }
    });

    if (errorMessages.length > 0) {
      setErrorMessage("There is Error in the excel sheet");
    } else {
      setErrorMessage("");
    }

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const newname = filename?.replace(".xlsx", "_errorsheet.xlsx");
      saveAs(blob, newname);
      setuploaderr(false);
      setreddata(null);
      setJsonData(null);
    });
  };

  const generateHeadersExcel = () => {
    const headers = [
      "Base HL File Number",
      "Loan amount Max",
      "Tenor Min",
      "Tenor Max",
      "Net ROI",
      "Net Income",
      "Obligation",
      "Fees Percentage",
      "Fees Amount",
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerStyle = {
      font: { bold: true, color: { argb: "000000" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEA00" },
      },
    };

    worksheet.addRow(headers);
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "Eligible_KYC_File.xlsx");
    });
  };

  return (
    <Box>
      <Typography
        style={{ backgroundColor: "#004a92", color: "white" }}
        variant="h4"
        sx={{ fontStyle: "bold", fontFamily: "Helvetica Neue" }}
      >
        Upload Excel File
      </Typography>
      <Container maxWidth="xs">
        <Grid container mt={10} columnSpacing={20} rowSpacing={3}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={generateHeadersExcel}
              style={{ fontSize: "0.7rem", width: "160px" }}
            >
              Download Excel
            </Button>
          </Grid>

          <Grid item xs={12} sm={4}>
            <label htmlFor="file-input">
              <Button
                variant="contained"
                component="span"
                style={{ fontSize: "0.7rem", width: "160px" }}
              >
                {uploadedFile ? uploadedFile.name : "Upload"}
              </Button>
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx"
              style={{ display: "none" }}
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Grid>
        </Grid>
        {errorMessage && (
          <Typography variant="body1" color="error" sx={{ marginTop: 1 }}>
            {errorMessage}
          </Typography>
        )}
        {successMessage && (
          <Typography variant="body1" color="success" sx={{ marginTop: 1 }}>
            {successMessage}
          </Typography>
        )}
      </Container>
    </Box>
  );
}

export default Upload;