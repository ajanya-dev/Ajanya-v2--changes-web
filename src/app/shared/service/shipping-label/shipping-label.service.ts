import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  IShippingLabelAddress,
  IAddressList,
  ICreateParcel,
  IBuyShipment,
  IAddressDetails,
  IParcelDetails,
  IShippView,
  IToolTipDimension,
  IQuicklabelDetails,
  IGetQuickLabel,
  ICarrierData,
  IGetPrintSize,
  IUserData
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { environment } from 'src/environments/environment';

interface IGetAddress {
  success: boolean;
  data: IAddressList[];
  rowCount: number;
}

interface IGetSingleAddress {
  result: IShippingLabelAddress;
  success: boolean;
}

interface IShipmentDetails {
  success: boolean;
  data: {
    detailsAddressId: string;
    services: {
      USPS: IParcelDetails[];
      FedEx: IParcelDetails[];
    };
  };
  rowCount: number;
}

interface IPrintShipment {
  success: boolean;
  data: {
    url: string;
  };
  /**
   * Set when the label could not be bought. The endpoint answers 200 with
   * `success: false` and the reason here, so the error interceptor never sees
   * it and callers have to surface it themselves.
   */
  errorMsg?: string;
  message?: string;
}
@Injectable({
  providedIn: 'root'
})
export class ShippingLabelService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  saveDeliveryAddress(
    data: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.post<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/delivery-address`,
      data
    );
  }

  getAllDeliveryAddress(): Observable<IGetAddress> {
    return this.http.get<IGetAddress>(
      `${this.ROOT_URL}/business-tool/shipping/delivery-address`
    );
  }

  updateDeliveryAddress(
    id: string,
    data: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.put<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/delivery-address/${id}`,
      data
    );
  }

  getUserAddress(): Observable<IGetSingleAddress> {
    return this.http.get<IGetSingleAddress>(
      `${this.ROOT_URL}/business-tool/shipping/from-address/copy-from-user-profile`
    );
  }

  createFromAddress(
    data: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.post<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/from-address`,
      data
    );
  }

  updateFromAddress(
    id: string,
    data: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.put<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/from-address/${id}`,
      data
    );
  }

  createReturnAddress(
    data: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.post<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/return-address`,
      data
    );
  }

  updateReturnAddress(
    id: string,
    data: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.put<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/return-address/${id}`,
      data
    );
  }

  getAllFromAddress(): Observable<IGetAddress> {
    return this.http.get<IGetAddress>(
      `${this.ROOT_URL}/business-tool/shipping/from-address`
    );
  }

  deleteFromAddress(id: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/business-tool/shipping/from-address/${id}`
    );
  }

  deleteDeliveryAddress(id: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/business-tool/shipping/delivery-address/${id}`
    );
  }

  createParcel(data: ICreateParcel): Observable<IApiRes<ICreateParcel>> {
    return this.http.post<IApiRes<ICreateParcel>>(
      `${this.ROOT_URL}/business-tool/shipping/create-parcel-details`,
      data
    );
  }

  buyShipment(data: IAddressDetails): Observable<IShipmentDetails> {
    return this.http.post<IShipmentDetails>(
      `${this.ROOT_URL}/business-tool/shipping/create-parcel`,
      data
    );
  }

  printShipment(data: IBuyShipment): Observable<IPrintShipment> {
    return this.http.post<IPrintShipment>(
      `${this.ROOT_URL}/business-tool/shipping/buy-shipment`,
      data
    );
  }

  printMultiShippingLabel(
    shippingLabelIds: string[]
  ): Observable<IPrintShipment> {
    return this.http.post<IPrintShipment>(
      `${this.ROOT_URL}/business-tool/shipping/multi/print-label`,
      { ids: shippingLabelIds }
    );
  }

  deleteMutltiShippingLabel(
    shippingLabelIds: string[]
  ): Observable<IApiRes<string[]>> {
    return this.http.post<IApiRes<string[]>>(
      `${this.ROOT_URL}/business-tool/shipping/multi/delete`,
      { ids: shippingLabelIds }
    );
  }

  deleteLabel(id: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/business-tool/shipping/delete/${id}`
    );
  }

  printLabel(id: string, data: null): Observable<IPrintShipment> {
    return this.http.post<IPrintShipment>(
      `${this.ROOT_URL}/business-tool/shipping/${id}/print`,
      data
    );
  }

  shippingLabelView(id: string): Observable<IApiRes<IShippView>> {
    return this.http.get<IApiRes<IShippView>>(
      `${this.ROOT_URL}/business-tool/shipping/view/${id}`
    );
  }

  // Quick Label//

  getSingleFromAddress(id: string): Observable<IApiRes<IShippingLabelAddress>> {
    return this.http.get<IApiRes<IShippingLabelAddress>>(
      `${this.ROOT_URL}/business-tool/shipping/from-address/${id}`
    );
  }

  getShippingTypeDetails(
    data: IGetQuickLabel
  ): Observable<IApiRes<IQuicklabelDetails>> {
    return this.http.post<IApiRes<IQuicklabelDetails>>(
      `${this.ROOT_URL}/business-tool/shipping/quick-label-parcel`,
      data
    );
  }

  getTooltipDimensions(): Observable<IApiRes<IToolTipDimension[]>> {
    return this.http.get<IApiRes<IToolTipDimension[]>>(
      `${this.ROOT_URL}/business-tool/shipping/view-tooltip-dimensions`
    );
  }

  getPrintSizes(data: ICarrierData): Observable<IApiRes<IGetPrintSize[]>> {
    return this.http.post<IApiRes<IGetPrintSize[]>>(
      `${this.ROOT_URL}/business-tool/shipping/print-label-sizes`,
      data
    );
  }

  getUserDefaultAddress(): Observable<IApiRes<IUserData>> {
    return this.http.get<IApiRes<IUserData>>(
      `${this.ROOT_URL}/business-tool/shipping/from-address/default-address`
    );
  }
}
