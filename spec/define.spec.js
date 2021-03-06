describe("#define directive", function() {

    it("allows to define simple parameterless macros", function() {
        var input = "#define PI 3.14\n\
2 * PI * r";
        var expected = "2 * 3.14 * r";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to define macros with parameters", function() {
        var input = "#define mult(x, y) (x * y)\n\
mult(2, 3);";
        var expected = "(2 * 3);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("does not support multiline macros", function() {
        var input = "#define add(x, y) x + \n\
y\n\
add(1, 2);";
        var expected = "y\n\
1 + ;";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to use the same macro on different lines", function() {
        var input = "#define mult(x, y) (x * y)\n\
mult(3, 4);\n\
mult(5, 6);\n\
mult(7, 8);";
        var expected = "(3 * 4);\n\
(5 * 6);\n\
(7 * 8);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to use the same macro a few times on the same line", function() {
        var input = "#define add(x, y) (x + y)\n\
add(3, 4) + add(5, 6) + add(7, 8)";
        var expected = "(3 + 4) + (5 + 6) + (7 + 8)";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("processes different spacing for macro arguments", function() {
        var input = "#define array(a, b, c, d, e) [a, b, c, d, e]\n\
array(  1, 2 ,  3  ,4,5)";
        var expected = "[1, 2, 3, 4, 5]";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to define and use several macros", function() {
        var input = "#define mult(x, y) (x * y)\n\
#define add(x, y) (x + y)\n\
#define minus(x, y) (x - y)\n\
mult(1, 2);\n\
add(1, 2);\n\
minus(1, 2);";

        var expected = "(1 * 2);\n\
(1 + 2);\n\
(1 - 2);";

        expect(prepr.preprocess(input)).toBe(expected);
    });
    
    /*
     * Not all the combinations are supported, for example, using
     * arithmetical operators in nested macros like mult(add(1, 2) + add(3, 4), 3).
     * 
     * In nested macros arguments can be either alpha-numerical or other allowed nested macros.
     * This is the limitation of the current implementation.
     */
    it("allows nested macros", function() {
        var input = "#define mult(x, y) (x * y)\n\
#define add(x, y) (x + y)\n\
mult(add(1, 2), 3);";
        var expected = "((1 + 2) * 3);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("supports macro names starting with $", function() {
        var input = "#define $COLOR1 rgb(12, 12, 12)\n\
$COLOR1";
        var expected = "rgb(12, 12, 12)";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("supports blanks and dots in macro values", function() {
        var input = "#define METHOD(CLASS_NAME, NAME) CLASS_NAME.prototype.NAME = function\n\
METHOD(Vector, add)(other) {\n\
    return new Vector(this.x + other.x, this.y + other.y);\n\
};";
        var expected = "Vector.prototype.add = function(other) {\n\
    return new Vector(this.x + other.x, this.y + other.y);\n\
};";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to use same variable in the body of a macro a few times", function() {
        var input = "#define SQUARE(X) X * X\n\
SQUARE(2)";
        var expected = "2 * 2";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to use several variables in the body of a macro", function() {
        var input = "#define MULT(X, Y, Z) X * Y * Z\n\
MULT(2, 3, 4)";
        var expected = "2 * 3 * 4";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("is case sensitive", function() {
        var input = "#define MAX(X, Y) ((X > Y) ? X : Y)\n\
max(2, 3)\n\
MAX(3, 4)";
        var expected = "max(2, 3)\n\
((3 > 4) ? 3 : 4)";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to redefine the same macro several times", function() {
        var input = "#define value_macro value1\n\
value_macro\n\
#define value_macro value2\n\
value_macro\n\
#define value_macro value3\n\
value_macro";
        var expected = "value1\n\
value2\n\
value3";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("does not assume that a predefined variable has a value of empty string", function() {
        var input = "var1";
        var expected = "var1";

        expect(prepr.preprocess(input, ["var1"])).toBe(expected);
    });

    it("allows to use undefined variables in the body of a macro", function() {
        var input = "#define mult(x, y) (x * y * z)\n\
mult(2, 3);";
        var expected = "(2 * 3 * z);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("allows to not use all variables in the body of a macro", function() {
        var input = "#define mult(x, y, z) (x * y)\n\
mult(2, 3, 4);";
        var expected = "(2 * 3);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("handles the case when too few arguments are provided to macro", function() {
        var input = "#define mult(x, y) (x * y)\n\
mult(2);";
        var expected = "(2 * y);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("handles the case when too many arguments are provided to macro", function() {
        var input = "#define mult(x, y) (x * y)\n\
mult(2, 5, 6);";
        var expected = "(2 * 5);";

        expect(prepr.preprocess(input)).toBe(expected);
    });

    it("raises error when macro name is not valid", function() {
        expect(function() {
            prepr.preprocess("#define #mult(x, y) (x * y)");
        }).toThrow(new Error("Macro name can contain letters, digits, underscores,\
$ as the first symbol and can start with letter or digit or $"));
    });

    it("does not substitute macros in the body of another macro", function() {
        var input = "#define add(x, y) (x + y)\n\
#define addOne(x) add(x, 1)\n\
addOne(3);";
        var expected = "add(3, 1);";

        expect(prepr.preprocess(input)).toBe(expected);
    });
});