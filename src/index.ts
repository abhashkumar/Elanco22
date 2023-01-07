import axios from "axios";
import _ from 'lodash';
import $ from "jquery";
import { renderChart } from "./renderChart";

const baseurl = `https://engineering-task.elancoapps.com/api/`
let resources: Array<string>;


var currentPage = 0;
var pages = null;
var userData = null;
var page_size = 10;

// signifies ascending
var costOrder = 0;
var consumerQUantityOrder = 0;
var dateOrder = 0;


async function init() {
  await getResources();
  $("#ResourceDetail").hide();
  $("#Resources").show();
  $(".chartreport1").hide();
  $(".chartreport2").hide();
}


export async function getResources() {
  resources = new Array<string>();
  let resourceUrl = `${baseurl}resources`;
  const res: any = await axios.get(resourceUrl);
  resources = res.data;
  appendData(res.data);
}

async function appendData(data: any) {
  $("#ResourceData").empty();
  const tbody = document.getElementById("ResourceData") as HTMLTableElement;
  _.each(data, function (ele, i) {

    var newRow = tbody.insertRow();
    var newCell = newRow.insertCell(0);
    var newText = document.createTextNode(i);
    newCell.appendChild(newText);

    var newCell2 = newRow.insertCell(1);
    var newText2 = document.createTextNode(ele);
    newCell2.appendChild(newText2);

    var newCell3 = newRow.insertCell(2);
    var newText3 = document.createElement('a');
    newText3.setAttribute('href', '#');
    newText3.addEventListener('click', () => getSpecificResource(data[i]))
    newText3.text = "Details";
    newCell3.appendChild(newText3);

  })
}

function AddEventHandlerToPager() {

  document.getElementById("Previous")?.addEventListener("click", () => prePage());
  document.getElementById("Next")?.addEventListener("click", () => nextPage());
  document.getElementById("CostHeader")?.addEventListener("click", () => costSortingToggle());
  document.getElementById("ConsumerQuantityHeader")?.addEventListener("click", () => consumerQuantitySortingToggle());
  document.getElementById("DateHeader")?.addEventListener("click", () => dateSortingToggle());

}

export async function getSpecificResource(resourceName: string) {

  document.getElementById("ResourceNameSpan").innerText = resourceName;
  //set ordering to default
  costOrder = 0;
  consumerQUantityOrder = 0;
  dateOrder = 0;

  AddEventHandlerToPager();

  let singleResource = `${baseurl}resources/${resourceName}`;
  const res: any = await axios.get(singleResource);

  userData = res.data;
  doPaging();
  renderLineChartByCost();
  renderLineChartByConsumedQuantity();

  return res;
}

function doPaging() {

  // handle situation when there is huge data
  if (userData.length > 300 && userData.length <= 600) {
    page_size = 20;
  }

  if (userData.length > 600) {
    page_size = 30;
  }

  currentPage = 0;

  pages = paginate(userData, page_size);
  let pageLi = "";

  $(".page-data").empty();
  $(".between").remove();
  $("#Resources").hide();
  $("#ResourceDetail").show();

  pages.forEach((element: any, index: any) => {
    if (index != 0 && index <= 30) {
      pageLi = '<li  id="page_' + index + '" class="page-item list-item between" id="page_' + index + '"><a class="page-link" href="javascript:void(0)">' + index + '</a></li>';
      $("#Next").before(pageLi);
    }
  });

  pages.forEach((element: any, index: number) => {
    if (index != 0 && index <= 30) {
      document?.getElementById("page_" + index)?.addEventListener("click", () => pageChange(index));
    }
  });

  let page: any = pages[currentPage];
  printRows(page);

}


export function nextPage() {
  var page: any;
  if (pages.length - 1 > currentPage)
    page = currentPage + 1;
  pageChange(page);
}

export function prePage() {
  var page: any;
  if (currentPage < pages.length && currentPage != 0)
    page = currentPage - 1;
  pageChange(page);
}

export function pageChange(page: any) {
  currentPage = page;
  $(".list-item").removeClass("active");
  $("#page_" + page).addClass("active");
  $(".page-data").html("");
  page = pages[page];
  printRows(page);
}

export function printRows(arr: any) {
  $(".page-data").empty();
  arr.forEach((element: any) => {
    $(".page-data").append("<tr><td>" + element.ConsumedQuantity + "</td><td>" + (Math.round(element.Cost * 10000) / 10000).toFixed(4) + "</td><td>" + element.Date + "</td><td>" + element.UnitOfMeasure + "</td></tr>");

  });
}

export function paginate(arr: any, size: any) {
  return arr.reduce((acc: any, val: any, i: any) => {
    let idx = Math.floor(i / size)
    let page = acc[idx] || (acc[idx] = [])
    page.push(val)
    return acc
  }, [])
}

export function costSortingToggle() {

  userData.sort(function (a, b) {
    return Number(a.Cost) - Number(b.Cost)
  });

  if (costOrder == 0) {
    costOrder = 1;
  }
  else {
    costOrder = 0;
    userData.reverse();
  }
  doPaging();
}

export function consumerQuantitySortingToggle() {

  userData.sort(function (a, b) {
    return Number(a.ConsumedQuantity) - Number(b.ConsumedQuantity)
  });
  if (consumerQUantityOrder == 0) {
    consumerQUantityOrder = 1;
  }
  else {
    consumerQUantityOrder = 0;
    userData.reverse();
  }
  doPaging();
}

export function dateSortingToggle() {

  userData.sort(function (x, y) {
    var a = x.Date;
    var b = y.Date;
    var aa = a.split('/').reverse().join(),
      bb = b.split('/').reverse().join();
    return aa < bb ? -1 : (aa > bb ? 1 : 0);
  });

  if (dateOrder == 0) {
    dateOrder = 1;
  }
  else {
    dateOrder = 0;
    userData.reverse();
  }

  doPaging();
}

function getSortedChunkedData() {

  let chunkDataCopy = [...userData];

  chunkDataCopy.sort(function (x, y) {
    var a = x.Date;
    var b = y.Date;
    var aa = a.split('/').reverse().join(),
      bb = b.split('/').reverse().join();
    return aa < bb ? -1 : (aa > bb ? 1 : 0);
  });

  chunkDataCopy.reverse();
  return chunkDataCopy;
}

export function renderLineChartByCost() {

  //destroy the existing chart if any
  $("canvas#acquisitions").remove();
  $("div.chartreport1").append('<canvas id="acquisitions"></canvas>');

  let chunkDataCopy = getSortedChunkedData();

  let dataMap = new Map<any, any>();

  chunkDataCopy.every(function (element: any) {

    if (dataMap.has(element.Date)) {
      dataMap[element.Date] += element.Cost;
    }
    else {
      dataMap.set(element.Date, element.Cost);
      if (dataMap.size == 10) {
        return false;
      }
    }
    return true;
  })

  renderChart("acquisitions", Array.from(dataMap.keys()), Array.from(dataMap.values()), 'Cost Variation by last 10 dates');
  $(".chartreport1").show();
}

export function renderLineChartByConsumedQuantity() {

  //destroy the existing chart if any
  $("canvas#acquisitions1").remove();
  $("div.chartreport2").append('<canvas id="acquisitions1"></canvas>');

  let chunkDataCopy = getSortedChunkedData();

  chunkDataCopy.reverse();
  let dataMap = new Map<any, any>();

  chunkDataCopy.every(function (element: any) {

    if (dataMap.has(element.Date)) {
      dataMap[element.Date] += element.ConsumedQuantity;
    }
    else {
      dataMap.set(element.Date, element.ConsumedQuantity);
      if (dataMap.size == 10) {
        return false;
      }
    }
    return true;
  })

  renderChart("acquisitions1", Array.from(dataMap.keys()), Array.from(dataMap.values()), 'Consumed quantity Variation by last 10 dates');
  $(".chartreport2").show();
}


document.getElementById("ResourcesTab").addEventListener("click", () => init());