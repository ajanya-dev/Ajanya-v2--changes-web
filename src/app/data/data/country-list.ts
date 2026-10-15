import { ICountryModel } from "src/app/models/common";
import data from 'src/app/data/data/country-list-json/country-list-code.json';

export class Country {
    static countryList():ICountryModel[] {
        return data  as ICountryModel[];

    }

}
