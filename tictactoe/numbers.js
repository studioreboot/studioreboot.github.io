(function(global){

class Fraction {
    constructor (num = 1, den = 2) {
        this.numerator = num;
        this.denominator = den;
    }

    toNumber () {
        return this.numerator / this.denominator;
    }
}

class MixedNumber extends Fraction {
    constructor (number = 1, num = 1, den = 2) {
        this.number = number;
        this.numerator = num;
        this.denominator = den;
    }

    toNumber () {
        return 
    }

    
}

})(globalThis);