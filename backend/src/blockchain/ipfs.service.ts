import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface IpfsUploadResult {
  cid: string;
  url: string;
  size: number;
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfsGateway: string;
  private readonly ipfsApiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.ipfsGateway = this.configService.get<string>('IPFS_GATEWAY') || 'https://ipfs.io/ipfs/';
    this.ipfsApiUrl = this.configService.get<string>('IPFS_API_URL') || 'http://localhost:5001/api/v0';
  }

  /**
   * Upload content to IPFS
   * @param content - Content buffer or string
   * @param filename - Optional filename
   * @returns IPFS CID and gateway URL
   */
  async upload(content: Buffer | string, filename?: string): Promise<IpfsUploadResult> {
    try {
      const formData = new FormData();
      const blob = content instanceof Buffer
        ? new Blob([new Uint8Array(content)] as BlobPart[])
        : new Blob([content] as BlobPart[]);
      formData.append('file', blob, filename || 'file');

      const response = await axios.post(`${this.ipfsApiUrl}/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const cid = response.data.Hash;
      const size = response.data.Size;

      this.logger.log(`Uploaded to IPFS: ${cid} (${size} bytes)`);

      return {
        cid,
        url: `${this.ipfsGateway}${cid}`,
        size,
      };
    } catch (error) {
      this.logger.error(`IPFS upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload content to IPFS');
    }
  }

  /**
   * Upload JSON object to IPFS
   * @param data - JSON object
   * @returns IPFS CID and gateway URL
   */
  async uploadJSON(data: any): Promise<IpfsUploadResult> {
    const jsonString = JSON.stringify(data);
    return this.upload(Buffer.from(jsonString), 'data.json');
  }

  /**
   * Retrieve content from IPFS
   * @param cid - IPFS CID
   * @returns Content as buffer
   */
  async retrieve(cid: string): Promise<Buffer> {
    try {
      const response = await axios.get(`${this.ipfsGateway}${cid}`, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`IPFS retrieval failed: ${error.message}`);
      throw new BadRequestException('Failed to retrieve content from IPFS');
    }
  }

  /**
   * Retrieve JSON object from IPFS
   * @param cid - IPFS CID
   * @returns Parsed JSON object
   */
  async retrieveJSON(cid: string): Promise<any> {
    try {
      const response = await axios.get(`${this.ipfsGateway}${cid}`);
      return response.data;
    } catch (error) {
      this.logger.error(`IPFS JSON retrieval failed: ${error.message}`);
      throw new BadRequestException('Failed to retrieve JSON from IPFS');
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   * @param cid - IPFS CID
   * @returns Gateway URL
   */
  getGatewayUrl(cid: string): string {
    return `${this.ipfsGateway}${cid}`;
  }

  /**
   * Pin content to IPFS node (keep it available)
   * @param cid - IPFS CID
   */
  async pin(cid: string): Promise<void> {
    try {
      await axios.post(`${this.ipfsApiUrl}/pin/add?arg=${cid}`);
      this.logger.log(`Pinned to IPFS: ${cid}`);
    } catch (error) {
      this.logger.error(`IPFS pinning failed: ${error.message}`);
      throw new BadRequestException('Failed to pin content to IPFS');
    }
  }

  /**
   * Unpin content from IPFS node
   * @param cid - IPFS CID
   */
  async unpin(cid: string): Promise<void> {
    try {
      await axios.post(`${this.ipfsApiUrl}/pin/rm?arg=${cid}`);
      this.logger.log(`Unpinned from IPFS: ${cid}`);
    } catch (error) {
      this.logger.error(`IPFS unpinning failed: ${error.message}`);
      // Don't throw error for unpinning failures
      this.logger.warn('Continuing despite unpin failure');
    }
  }

  /**
   * Check if CID is valid
   * @param cid - IPFS CID
   * @returns Boolean indicating validity
   */
  isValidCID(cid: string): boolean {
    // Basic CID validation (v0 and v1)
    const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidV1Regex = /^b[a-z2-7]{58}$/;
    return cidV0Regex.test(cid) || cidV1Regex.test(cid);
  }
}
