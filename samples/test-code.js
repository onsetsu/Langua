// test utils
function expectEqual(a, b) {
	if (a !== b) {
		console.error(a, "!=", b);
		throw new Error(a + "!=" + b);
	}
}

function expectNaN(a) {
	if (!isNaN(a)) {
		throw new Error(a, "is not NaN");
	}
}

var a = {b: {c: 3}};

expectEqual(a?.b?.c + a.b.c, 6);
expectNaN(a!.b + a.b!.c);
expectEqual(a?.b!.c, 3);

// function createLayer() {}

function opt(a, b) {
	if (a != null) {
		return b(a);
	}
}

// layer Test {
// 	extends class A {}
// 	extends class B {
// 		method: function() {}
// 	}
// }

// function sql() {}

// sql { select * from bla };

var id = (a) => a;
var fn1 = id;
var fn2 = (a) => 2*a;

var data = 10;

expectEqual(data |> fn1 |> fn2, 20);
expectEqual((a?.b.c ? 1 : 0) |> fn1 |> fn2, 2);
expectEqual((!a ? 1 : 0) |> fn1 |> (a) => a, 0);

'UnitInitializer';
'UncertaintyInitializer';

// units
var unitVal = 100km + 10 mm + 5 m;
console.log("unitVal", unitVal);
expectEqual(unitVal.scalar, 100.00501);
expectEqual(unitVal._units, "km");

// // uncertainty
var uncertVal = 100+-1 + 10+-0.1;
console.log("uncertVal", uncertVal);
expectEqual(uncertVal.val, 110);
expectEqual(uncertVal.delta, 1.1);

// // units + uncertainty
// // 100km+-1 // by default uncertainty should be in the same unit as the subject number
// // 100km + 0+-1 // adding uncertainty can be achieved by adding 0+-1
// // debugger;
// var uncertUnitVal = 100km+-1m + 50km+-1m // uncertainty can be added in another unit
// console.log("uncertUnitVal", uncertUnitVal)
// expectEqual(uncertUnitVal.val.val, 150);
// expectEqual(uncertUnitVal.val.unit, "km");
// expectEqual(uncertUnitVal.delta.val, 2);
// expectEqual(uncertUnitVal.delta.unit, "m");


// console.log("\n\n\n")
// console.log("100+-1 +1m ==", 100+-1 +1m);
// console.log("100m+-1m +1m ==", 100m+-1m +1m);
// console.log("100+-1m ==", 100+-1m);
// console.log("100+-1m + 200+-2m ==", 100+-1m + 200+-2m);
// console.log("100m+-1m + 200+-2m ==", 100m+-1m + 200+-2m);
// console.log("\n\n\n")

// console.log("(100+-1) + 0m ==", (100+-1) + 0m);


// // var ten = 10;
// // console.log("(100)km + (ten)m", (100)km + (ten)m);
// // console.log("ten +- (ten/10)", ten +- (ten/10));
// // console.log("(ten)m", (ten)m);
// // console.log("(ten)m +- ((ten/10)m)", (ten)m +- ((ten/10)m));