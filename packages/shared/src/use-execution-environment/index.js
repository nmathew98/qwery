export var ExecutionEnvironment;
(function (ExecutionEnvironment) {
	ExecutionEnvironment[(ExecutionEnvironment["Browser"] = 1)] = "Browser";
	ExecutionEnvironment[(ExecutionEnvironment["Server"] = 2)] = "Server";
})(ExecutionEnvironment || (ExecutionEnvironment = {}));
