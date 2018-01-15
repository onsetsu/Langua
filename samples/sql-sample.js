function sql(query) {
	console.log(query);
	return 3;
};

console.log("test" |> sql);

function getLimit() {
    return 4;
}
const data = {name: "aTable"}
const a = sql {
    select *
    from ${data?.name || "default"}
    limit ${ sql { select count(*) from bla } }
};