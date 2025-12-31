const landingPageService = require('../services/landingPageService');
const communityService = require('../services/communityService');
const footerService = require('../services/footerService');
const ApiResponse = require('../utils/ApiResponse');

class PublicController {
  async getLandingPage(req, res) {
    try {
      const data = await landingPageService.getLandingPageData();
      res.status(200).json(ApiResponse.success(data, 'Landing page data retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get landing page data', 500));
    }
  }

  async getCommunityStories(req, res) {
    try {
      const stories = communityService.getCommunityStories();
      const howItWorks = communityService.getHowSwappingWorks();
      
      const data = {
        stories,
        howItWorks
      };
      
      res.status(200).json(ApiResponse.success(data, 'Community stories retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get community stories', 500));
    }
  }

  async getFooter(req, res) {
    try {
      const footerData = footerService.getFooterData();
      res.status(200).json(ApiResponse.success(footerData, 'Footer data retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get footer data', 500));
    }
  }
}

module.exports = new PublicController();