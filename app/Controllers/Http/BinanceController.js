'use strict'

const binance = require('node-binance-api')().options({
  APIKEY: 'mm8Tvcflwnjgc2fklrvsluJcrQi2947zijn2caXSCNTmeIak67H5SEEg5sAxt1s2',
  APISECRET: '9ifB6F8abFpTOLZrvvrnZZtsdyojolOizdAtpe4Nd672jEDIOMcONb7tNjcMa2KF',
  useServerTime: true // If you get timestamp errors, synchronize to server time at startup
});

const Pair = use('App/Models/Pair')


class BinanceController {
	async binance({params, request, response, antl, view, auth, session}){

	binance.prices('BNBBTC', (error, ticker) => {
  console.log("Price of BNB: ", ticker.BNBBTC);
});

binance.prevDay(false, (error, prevDay) => {
  // console.log(prevDay); // view all data
  for ( let obj of prevDay ) {
    let symbol = obj.symbol;
    console.log(symbol+" volume:"+obj.volume+" change: "+obj.priceChangePercent+"%");
  }
});
							
	return view.render('binance.binance')  

	}

}

module.exports = BinanceController