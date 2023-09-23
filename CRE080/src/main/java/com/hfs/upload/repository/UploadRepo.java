package com.hfs.upload.repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hfs.upload.bean.UploadBean;


@Repository
public interface UploadRepo extends JpaRepository<UploadBean, Long>{
	@Query(value = "SELECT u.CONTRACT_BRANCH FROM Cc_Contract_Master u WHERE u.CONTRACT_NUMBER =:CONTRACT_NUMBER", nativeQuery = true)
	String getBranchByfileNo(@Param("CONTRACT_NUMBER")String fileno);

	@Query(value = "Select Base_HL_File_Number from UploadBean")
	List<String> getAllFIles();
	
//	@Query(value = "select * from Hfs_File_Upload where BRANCH =:BRANCH", nativeQuery = true)
	
	@Query(value = "select * from Hfs_File_Upload where approval = 0 and BRANCH =:BRANCH", nativeQuery = true)

	List<UploadBean>findBybranch(@Param("BRANCH")String Branch);

	@Query(value = "select * from Hfs_File_Upload where status = 0 and BRANCH =:BRANCH", nativeQuery = true)
	List<UploadBean>findDeactiveFiles(@Param("BRANCH")String Branch);

	
	
	@Query(value = "select DIVISION_CODE From Sa_Division_Master Where DIVISION_DESCRIPTION = 'SUNDARAM IPL'", nativeQuery = true)

	String getDivisioncode();

	

	@Query(value = "Select SM_SCHEME_CODE From Sa_Scheme_Master Where SM_SCHEME_DESC = 'SALARIED_V'", nativeQuery = true)

	String getschemecode();

	

	@Query(value = "select ATY_APPRAISAL_TYPE_CODE From Sa_Appraisal_Type_Master where ATY_APPRAISAL_TYPE_DESC = 'INDIVIDUAL HOME LOANS'", nativeQuery = true)

	String getAppcode();

  

	@Query(value = "SELECT\r\n"
            + "     MINIMUM_TERM, MAXIMUM_TERM\r\n"
            + "     FROM sa_product_scheme_master_hdr\r\n"
            + "     WHERE division_code =:Division_Code\r\n"
            + "     AND scheme_code =:Scheme_code\r\n"
            + "     AND proposal_type_code =:Propose_code", nativeQuery = true)
    List<Map<String,String>> getminmaxtennor(@Param("Division_Code")String divisioncode ,@Param("Scheme_code")String scehemecode,@Param("Propose_code")String prposecode);
    
    
    @Query(value = "select BASE_HL_FILE_NUMBER from Hfs_File_Upload where APPROVAL = 0 and BRANCH=:branch", nativeQuery = true)
    List<String> getapprovallist(@Param("branch")String branch);
}